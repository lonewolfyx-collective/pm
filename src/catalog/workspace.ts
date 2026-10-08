import type { CatalogWorkspace, ResolveConfig } from '../types.ts'
import { writeFile } from 'node:fs/promises'
import { log } from '@clack/prompts'
import { definePackageJSON, readPackageJSON, resolvePackageJSON, writePackageJSON } from 'pkg-types'
import { Document, isMap } from 'yaml'
import { normalizeDependencies } from '../utils.ts'
import { matchesOverrideDependency } from './utils.ts'

export const dependencyFields = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'] as const

export function catalogName(specifier: string): string | undefined {
  return specifier.startsWith('catalog:') ? specifier.slice('catalog:'.length) || 'default' : undefined
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
    info: normalizeDependencies(root),
  }

  const manifests: CatalogWorkspace['manifests'] = []
  for (const { file, info } of [rootProject, ...projects.filter(project => project.file !== rootProject.file)]) {
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

  for (const [key, specifier] of Object.entries((workspaceConfig.overrides ?? {}) as Record<string, string>)) {
    const catalog = catalogs.find(catalog => catalog.name === catalogName(specifier))
    if (!catalog) {
      continue
    }
    const dependency = catalog.entries.items.map(entry => String(entry.key))
      .find(dependency => matchesOverrideDependency(key, dependency))
    if (dependency) {
      catalog.used.add(dependency)
    }
  }
  return { file, document, catalogs, manifests }
}

export async function saveCatalogWorkspace(workspace: CatalogWorkspace): Promise<void> {
  const updates = []
  for (const manifest of workspace.manifests) {
    const data = definePackageJSON(Object.fromEntries(
      Object.entries({
        ...(await readPackageJSON(manifest.file)),
        ...manifest.data,
      }).filter(([field, dependencies]) => !Object.hasOwn(manifest.data, field) || Object.keys(dependencies).length > 0),
    ))
    updates.push({ file: manifest.file, data })
  }

  for (const { file, data } of updates) {
    await writePackageJSON(file, data)
  }
  await writeFile(workspace.file, workspace.document.toString())

  log.success('Catalogs updated. Run pnpm install to sync the lockfile.')
}
