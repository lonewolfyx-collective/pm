import type { PackageJson } from 'pkg-types'
import type { Document, YAMLMap } from 'yaml'
import type { ResolveConfig } from '../types.ts'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { log } from '@clack/prompts'
import { glob } from 'glob'
import { isMap, parseDocument } from 'yaml'

export const dependencyFields = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'] as const

export function catalogName(specifier: unknown): string | undefined {
  if (typeof specifier === 'string' && specifier.startsWith('catalog:')) {
    return specifier.slice('catalog:'.length) || 'default'
  }
}

export async function readCatalogWorkspace(config: ResolveConfig): Promise<{
  file: string
  document: Document
  catalogs: { name: string, path: string[], entries: YAMLMap, used: Set<string> }[]
  manifests: { file: string, source: string, data: PackageJson }[]
}> {
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
  const catalogs = names.map((name) => {
    const path = name === 'default' && document.has('catalog') ? ['catalog'] : ['catalogs', name]
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
    return { name, path, entries, used: new Set<string>() }
  })

  const rootFiles = await glob('package.json', { cwd: dirname(file), absolute: true, nodir: true })
  const files = [...new Set([...rootFiles, ...config.monorepo.package.map(project => project.file)])]
  const manifests = []
  for (const file of files) {
    const source = await readFile(file, 'utf8')
    const data = JSON.parse(source) as PackageJson
    if (!data || Array.isArray(data) || typeof data !== 'object') {
      throw new Error(`Invalid package.json: ${file}`)
    }
    manifests.push({ file, source, data })
    for (const field of dependencyFields) {
      const dependencies = data[field]
      if (dependencies == null) {
        continue
      }
      if (typeof dependencies !== 'object' || Array.isArray(dependencies)) {
        throw new TypeError(`Invalid ${field} in ${file}.`)
      }
      for (const [dependency, specifier] of Object.entries(dependencies)) {
        catalogs.find(catalog => catalog.name === catalogName(specifier))?.used.add(dependency)
      }
    }
  }

  const overrides = document.get('overrides')
  if (isMap(overrides)) {
    for (const entry of overrides.items) {
      const name = catalogName(overrides.get(entry.key))
      if (name === undefined) {
        continue
      }
      const catalog = catalogs.find(catalog => catalog.name === name)
      const selector = String(entry.key).split('>').pop()!.trim()
      const dependency = catalog?.entries.items.map(entry => String(entry.key))
        .find(dependency => selector === dependency || selector.startsWith(`${dependency}@`))
      if (!catalog || !dependency) {
        throw new Error(`Cannot resolve catalog dependency for override "${String(entry.key)}".`)
      }
      catalog.used.add(dependency)
    }
  }
  return { file, document, catalogs, manifests }
}

export async function saveCatalogWorkspace(workspace: Awaited<ReturnType<typeof readCatalogWorkspace>>): Promise<void> {
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
