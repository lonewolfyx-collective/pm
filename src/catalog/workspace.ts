import type { CatalogWorkspace, ResolveConfig } from '../types.ts'
import { writeFile } from 'node:fs/promises'
import { log } from '@clack/prompts'
import { definePackageJSON, readPackageJSON, resolvePackageJSON, writePackageJSON } from 'pkg-types'
import { Document, isMap } from 'yaml'

export const dependencyFields = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'] as const

export function catalogName(specifier: unknown): string | undefined {
  if (typeof specifier === 'string' && specifier.startsWith('catalog:')) {
    return specifier.slice('catalog:'.length) || 'default'
  }
}

export async function readCatalogWorkspace(config: ResolveConfig): Promise<CatalogWorkspace> {
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

  const manifests: CatalogWorkspace['manifests'] = []
  for (const { file, info } of [rootProject, ...projects]) {
    manifests.push({
      file,
      original: JSON.stringify(info),
      data: structuredClone(info),
    })
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

export async function saveCatalogWorkspace(workspace: CatalogWorkspace): Promise<void> {
  const updates = []
  for (const manifest of workspace.manifests) {
    const data = definePackageJSON({
      ...(await readPackageJSON(manifest.file)),
      ...manifest.data,
    })
    for (const field of dependencyFields) {
      if (Object.keys(manifest.data[field]).length === 0) {
        delete data[field]
      }
    }
    updates.push({ file: manifest.file, data })
  }

  for (const { file, data } of updates) {
    await writePackageJSON(file, data)
  }
  await writeFile(workspace.file, workspace.document.toString())
  log.success('Catalogs updated. Run pnpm install to sync the lockfile.')
}
