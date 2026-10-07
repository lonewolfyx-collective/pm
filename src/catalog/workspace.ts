import type { CANCEL_SYMBOL } from '@clack/prompts'
import type { PackageJson } from 'pkg-types'
import type { Document, YAMLMap } from 'yaml'
import type { ResolveConfig } from '../types.ts'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { cancel, log, select } from '@clack/prompts'
import { glob } from 'glob'
import { isMap, parseDocument } from 'yaml'

interface Catalog {
  name: string
  path: string[]
  entries: YAMLMap
}

interface CatalogWorkspace {
  file: string
  document: Document
  catalogs: Catalog[]
  manifests: {
    file: string
    source: string
    data: PackageJson
  }[]
  references: {
    catalog: string
    dependency: string
    key: string
    container: Record<string, string> | YAMLMap
  }[]
}

const dependencyFields = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'] as const

function catalogName(specifier: unknown): string | undefined {
  if (typeof specifier === 'string' && specifier.startsWith('catalog:')) {
    return specifier.slice('catalog:'.length) || 'default'
  }
}

export function catalogPath(workspace: CatalogWorkspace, name: string): string[] {
  if (name === 'default' && !workspace.document.hasIn(['catalogs', 'default'])) {
    return ['catalog']
  }
  return ['catalogs', name]
}

export function validateCatalogName(name: string): string | undefined {
  if (!/^[a-z0-9][\w.-]*$/i.test(name)) {
    return 'Use letters, digits, dots, underscores or hyphens, starting with a letter or digit.'
  }
}

export function cancelCatalog(): void {
  cancel('Catalog management cancelled.')
  process.exitCode = 1
}

export async function readCatalogWorkspace(config: ResolveConfig): Promise<CatalogWorkspace> {
  const file = config.monorepo.file
  if (!file) {
    throw new Error('Could not find pnpm-workspace.yaml.')
  }

  const document = parseDocument(await readFile(file, 'utf8'))
  if (document.errors.length) {
    throw document.errors[0]
  }
  if (!isMap(document.contents)) {
    throw new Error('pnpm-workspace.yaml must contain a mapping.')
  }

  const workspace: CatalogWorkspace = { file, document, catalogs: [], manifests: [], references: [] }
  const named = document.get('catalogs')
  if (named != null && !isMap(named)) {
    throw new Error('catalogs must contain a mapping.')
  }
  if (document.has('catalogs') && named == null) {
    document.set('catalogs', document.createNode({}))
  }
  if (document.has('catalog') && document.hasIn(['catalogs', 'default'])) {
    throw new Error('Define the default catalog using either catalog or catalogs.default, not both.')
  }

  const names = isMap(named) ? named.items.map(entry => String(entry.key)) : []
  if (document.has('catalog')) {
    names.unshift('default')
  }
  for (const name of names) {
    const path = catalogPath(workspace, name)
    const node = document.getIn(path)
    if (node != null && !isMap(node)) {
      throw new Error(`Catalog "${name}" must contain a mapping.`)
    }
    const entries: YAMLMap = isMap(node) ? node : document.createNode({})
    if (!isMap(node)) {
      document.setIn(path, entries)
    }
    if (entries.items.some(entry => typeof entries.get(entry.key) !== 'string')) {
      throw new Error(`Catalog "${name}" must contain dependency version strings.`)
    }
    workspace.catalogs.push({ name, path, entries })
  }

  const rootFiles = await glob('package.json', { cwd: dirname(file), absolute: true, nodir: true })
  const files = [...new Set([...rootFiles, ...config.monorepo.package.map(project => project.file)])]
  for (const file of files) {
    const source = await readFile(file, 'utf8')
    const data = JSON.parse(source) as PackageJson
    if (!data || Array.isArray(data) || typeof data !== 'object') {
      throw new Error(`Invalid package.json: ${file}`)
    }
    workspace.manifests.push({ file, source, data })
    for (const field of dependencyFields) {
      const container = data[field]
      if (container == null) {
        continue
      }
      if (typeof container !== 'object' || Array.isArray(container)) {
        throw new TypeError(`Invalid ${field} in ${file}.`)
      }
      for (const [dependency, specifier] of Object.entries(container)) {
        const catalog = catalogName(specifier)
        if (catalog !== undefined) {
          workspace.references.push({ catalog, dependency, key: dependency, container })
        }
      }
    }
  }

  const overrides = document.get('overrides')
  if (isMap(overrides)) {
    for (const entry of overrides.items) {
      const key = String(entry.key)
      const catalog = catalogName(overrides.get(key))
      if (catalog === undefined) {
        continue
      }
      const selector = key.split('>').pop()!.trim()
      const entries = workspace.catalogs.find(entry => entry.name === catalog)?.entries
      const dependency = entries?.items.map(entry => String(entry.key))
        .find(dependency => selector === dependency || selector.startsWith(`${dependency}@`))
      if (!dependency) {
        throw new Error(`Cannot resolve catalog dependency for override "${key}".`)
      }
      workspace.references.push({ catalog, dependency, key, container: overrides })
    }
  }
  return workspace
}

export async function chooseCatalog(workspace: CatalogWorkspace, name: string): Promise<Catalog | typeof CANCEL_SYMBOL> {
  if (name) {
    const catalog = workspace.catalogs.find(catalog => catalog.name === name)
    if (!catalog) {
      throw new Error(`Catalog "${name}" was not found.`)
    }
    return catalog
  }
  if (!workspace.catalogs.length) {
    throw new Error('No catalogs were found.')
  }
  return select({
    message: 'Select a catalog',
    options: workspace.catalogs.map(catalog => ({ value: catalog, label: catalog.name })),
  })
}

export async function chooseDependency(workspace: CatalogWorkspace, name: string | undefined): Promise<{ catalog: Catalog, dependency: string } | typeof CANCEL_SYMBOL> {
  const entries = workspace.catalogs.flatMap(catalog => catalog.entries.items
    .map(entry => ({ catalog, dependency: String(entry.key) })))
    .filter(entry => !name || entry.dependency === name)
  if (!entries.length) {
    throw new Error(name ? `Dependency "${name}" was not found in any catalog.` : 'No catalog dependencies were found.')
  }
  if (name && entries.length === 1) {
    return entries[0]!
  }
  return select({
    message: name ? `Select the source catalog for "${name}"` : 'Select a catalog dependency',
    options: entries.map(entry => ({
      value: entry,
      label: `${entry.dependency} (${entry.catalog.name})`,
      hint: String(entry.catalog.entries.get(entry.dependency)),
    })),
  })
}

export function updateCatalogReferences(workspace: CatalogWorkspace, name: string, dependency: string, to?: string): void {
  for (const reference of workspace.references) {
    if (reference.catalog !== name || reference.dependency !== dependency) {
      continue
    }
    const { container, key } = reference
    if (to === undefined) {
      if (isMap(container)) {
        container.delete(key)
      }
      else {
        delete container[key]
      }
    }
    else {
      const specifier = to === 'default' ? 'catalog:' : `catalog:${to}`
      if (isMap(container)) {
        container.set(key, specifier)
      }
      else {
        container[key] = specifier
      }
    }
  }
}

export function moveCatalogDependency(workspace: CatalogWorkspace, catalog: Catalog, dependency: string, to: string): void {
  const path = [...catalogPath(workspace, to), dependency]
  if (workspace.document.hasIn(path)) {
    throw new Error(`Catalog "${to}" already contains "${dependency}".`)
  }
  workspace.document.setIn(path, catalog.entries.get(dependency, true))
  workspace.document.deleteIn([...catalog.path, dependency])
  updateCatalogReferences(workspace, catalog.name, dependency, to)
}

export async function saveCatalogWorkspace(workspace: CatalogWorkspace): Promise<void> {
  const updates = []
  for (const manifest of workspace.manifests) {
    if (JSON.stringify(manifest.data) === JSON.stringify(JSON.parse(manifest.source))) {
      continue
    }
    const indent = manifest.source.match(/\n([\t ]+)"/)?.[1] ?? 2
    const newline = manifest.source.includes('\r\n') ? '\r\n' : '\n'
    const source = JSON.stringify(manifest.data, null, indent).replace(/\n/g, newline)
      + (manifest.source.endsWith('\n') ? newline : '')
    updates.push({ file: manifest.file, source })
  }
  updates.push({ file: workspace.file, source: workspace.document.toString() })
  for (const update of updates) {
    await writeFile(update.file, update.source)
  }
  log.success('Catalogs updated. Run pnpm install to sync the lockfile.')
}
