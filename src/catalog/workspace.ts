import type { YAMLMap } from 'yaml'
import type { ResolveConfig } from '../types.ts'
import { readFile, writeFile } from 'node:fs/promises'
import { log } from '@clack/prompts'
import { readPackageJSON, resolvePackageJSON } from 'pkg-types'
import { Document, isMap, parseDocument } from 'yaml'

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
  manifests: { file: string, original: string, data: ResolveConfig['monorepo']['package'][number]['info'] }[]
}> {
  const { file, workspaceConfig, package: projects } = config.monorepo
  if (!file) {
    throw new Error('Could not find pnpm-workspace.yaml.')
  }

  const document = new Document(structuredClone(workspaceConfig))
  if (!isMap(document.contents)) {
    throw new Error('pnpm-workspace.yaml must contain a mapping.')
  }
  const catalogs = [
    ...(Object.hasOwn(workspaceConfig, 'catalog')
      ? [{ name: 'default', path: ['catalog'], dependencies: workspaceConfig.catalog }]
      : []),
    ...Object.entries(workspaceConfig.catalogs ?? {})
      .map(([name, dependencies]) => ({ name, path: ['catalogs', name], dependencies })),
  ].map(({ name, path, dependencies }) => {
    const entries = document.createNode(dependencies ?? {})
    if (!isMap(entries)) {
      throw new Error(`Catalog "${name}" must contain a mapping.`)
    }
    if (entries.items.some(entry => typeof entries.get(entry.key) !== 'string')) {
      throw new Error(`Catalog "${name}" must contain dependency version strings.`)
    }
    document.setIn(path, entries)
    return { name, path, entries, used: new Set<string>() }
  })

  const root = await readPackageJSON(config.cwd)
  const rootProject = {
    file: await resolvePackageJSON(config.cwd),
    info: {
      dependencies: root.dependencies ?? {},
      devDependencies: root.devDependencies ?? {},
      optionalDependencies: root.optionalDependencies ?? {},
      peerDependencies: root.peerDependencies ?? {},
    },
  }

  const manifests = []
  for (const { file, info } of [rootProject, ...projects]) {
    const data = structuredClone(info)
    manifests.push({ file, original: JSON.stringify(info), data })
    for (const field of dependencyFields) {
      const dependencies = info[field]
      if (!dependencies) {
        continue
      }
      for (const [dependency, specifier] of Object.entries(dependencies)) {
        catalogs.find(catalog => catalog.name === catalogName(specifier))?.used.add(dependency)
      }
    }
  }

  for (const [key, specifier] of Object.entries(workspaceConfig.overrides ?? {})) {
    const catalog = catalogs.find(catalog => catalog.name === catalogName(specifier))
    if (!catalog) {
      continue
    }
    const selector = key.split('>').pop()!.trim()
    const dependency = catalog.entries.items.map(entry => String(entry.key))
      .find(dependency => selector === dependency || selector.startsWith(`${dependency}@`))
    if (dependency) {
      catalog.used.add(dependency)
    }
  }
  return { file, document, catalogs, manifests }
}

export async function saveCatalogWorkspace(workspace: Awaited<ReturnType<typeof readCatalogWorkspace>>): Promise<void> {
  const updates = []
  for (const manifest of workspace.manifests) {
    if (JSON.stringify(manifest.data) === manifest.original) {
      continue
    }
    const original = await readFile(manifest.file, 'utf8')
    const data = JSON.parse(original)
    const dependencies = JSON.parse(manifest.original)
    for (const field of dependencyFields) {
      if (JSON.stringify(manifest.data[field]) !== JSON.stringify(dependencies[field])) {
        data[field] = manifest.data[field]
      }
    }
    const indent = original.match(/\n([\t ]+)"/)?.[1] ?? 2
    const newline = original.includes('\r\n') ? '\r\n' : '\n'
    const source = JSON.stringify(data, null, indent).replace(/\n/g, newline)
      + (original.endsWith('\n') ? newline : '')
    updates.push({ file: manifest.file, source })
  }
  const document = parseDocument(await readFile(workspace.file, 'utf8'))
  if (document.errors.length) {
    throw document.errors[0]
  }
  const paths = [['catalog'], ['overrides']]
  const named = workspace.document.get('catalogs')
  if (!workspace.document.has('catalogs')) {
    document.delete('catalogs')
  }
  else if (isMap(named)) {
    const original = document.get('catalogs')
    const names = new Set([
      ...(isMap(original) ? original.items.map(entry => String(entry.key)) : []),
      ...named.items.map(entry => String(entry.key)),
    ])
    if (!isMap(original)) {
      document.set('catalogs', document.createNode({}))
    }
    paths.push(...[...names].map(name => ['catalogs', name]))
  }
  for (const path of paths) {
    if (!workspace.document.hasIn(path)) {
      document.deleteIn(path)
      continue
    }
    const entries = workspace.document.getIn(path)
    const original = document.getIn(path)
    if (!isMap(entries) || !isMap(original)) {
      document.setIn(path, entries)
      continue
    }
    for (const entry of [...original.items]) {
      if (!entries.has(entry.key)) {
        original.delete(entry.key)
      }
    }
    for (const entry of entries.items) {
      if (original.get(entry.key) !== entries.get(entry.key)) {
        original.set(entry.key, entries.get(entry.key, true))
      }
    }
  }
  updates.push({ file: workspace.file, source: document.toString() })
  for (const update of updates) {
    await writeFile(update.file, update.source)
  }
  log.success('Catalogs updated. Run pnpm install to sync the lockfile.')
}
