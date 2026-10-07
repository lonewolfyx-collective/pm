import type { ResolveConfig } from '../types.ts'
import { readFile, writeFile } from 'node:fs/promises'
import { cancel, isCancel, multiselect } from '@clack/prompts'
import { cyan } from 'ansis'
import { resolveCommand } from 'package-manager-detector'
import { readPackageJSON, resolvePackageJSON } from 'pkg-types'
import { isMap, parseDocument } from 'yaml'
import { catalogName } from '../catalog/workspace.ts'
import { executeCommand, runCommand } from '../run.ts'

type Project = ResolveConfig['monorepo']['package'][number]

const dependencyFields = ['dependencies', 'devDependencies', 'optionalDependencies'] as const
const referenceFields = [...dependencyFields, 'peerDependencies'] as const

export async function cleanCatalogs(
  config: ResolveConfig,
  rootFile: string,
  selections: Map<Project, string[]>,
): Promise<void> {
  const { file: workspaceFile, status, package: projects } = config.monorepo
  if (!workspaceFile) {
    return
  }
  const files = [...new Set([rootFile, ...(status ? projects.map(project => project.file) : [])])]
  const source = await readFile(workspaceFile, 'utf8')
  const document = parseDocument(source)
  if (document.errors.length) {
    throw document.errors[0]
  }

  const removals = new Map<string, string[]>()
  const catalogs = new Map<string, Set<string>>()
  for (const [project, packages] of selections) {
    removals.set(project.file, packages)
    for (const pkg of packages) {
      for (const field of dependencyFields.filter(field => Object.hasOwn(project.info[field], pkg))) {
        const name = catalogName(project.info[field][pkg]!)
        if (name !== undefined) {
          const entries = catalogs.get(name) ?? new Set<string>()
          entries.add(pkg)
          catalogs.set(name, entries)
        }
      }
    }
  }

  const manifests = await Promise.all(files.map(file => readPackageJSON(file)))
  const referenced = new Map<string, Set<string>>()
  for (const [index, manifest] of manifests.entries()) {
    const removedPackages = removals.get(files[index]!) ?? []
    for (const field of referenceFields) {
      for (const [pkg, specifier] of Object.entries(manifest[field] ?? {})) {
        if (removedPackages.includes(pkg)) {
          continue
        }
        const name = catalogName(specifier)
        if (name!) {
          const packages = referenced.get(name) ?? new Set<string>()
          packages.add(pkg)
          referenced.set(name, packages)
        }
      }
    }
  }
  const overrides = document.get('overrides', true)
  const isReferenced = (name: string, pkg: string): boolean => {
    return referenced.get(name)?.has(pkg) === true
      || (isMap(overrides) && overrides.items.some((entry) => {
        const selector = String(entry.key).split('>').pop()!.trim()
        return catalogName(String(entry.value)) === name
          && (selector === pkg || selector.startsWith(`${pkg}@`))
      }))
  }
  const isCatalogReferenced = (name: string): boolean => {
    return referenced.has(name)
      || (isMap(overrides) && overrides.items.some(entry => catalogName(String(entry.value)) === name))
  }

  let changed = false
  for (const [name, packages] of catalogs) {
    for (const pkg of packages) {
      if (isReferenced(name, pkg)) {
        continue
      }
      if (name === 'default' && document.hasIn(['catalog', pkg])) {
        changed = document.deleteIn(['catalog', pkg]) || changed
      }
      if (document.hasIn(['catalogs', name, pkg])) {
        changed = document.deleteIn(['catalogs', name, pkg]) || changed
      }
    }
    if (!isCatalogReferenced(name)) {
      if (name === 'default') {
        changed = document.delete('catalog') || changed
      }
      if (document.hasIn(['catalogs', name])) {
        changed = document.deleteIn(['catalogs', name]) || changed
      }
    }
  }

  const namedCatalogs = document.get('catalogs', true)
  if (isMap(namedCatalogs)) {
    for (const entry of [...namedCatalogs.items]) {
      const value = namedCatalogs.get(entry.key)
      if (!isCatalogReferenced(String(entry.key)) && (value == null || (isMap(value) && !value.items.length))) {
        changed = namedCatalogs.delete(entry.key) || changed
      }
    }
  }

  for (const field of ['catalog', 'catalogs']) {
    const node = document.get(field, true)
    if (document.has(field) && (document.get(field) == null || (isMap(node) && !node.items.length))) {
      changed = document.delete(field) || changed
    }
  }
  if (changed) {
    await writeFile(workspaceFile, document.toString())

    await executeCommand(resolveCommand(config.detect?.agent ?? 'npm', 'install', [])!, config)
  }
}

runCommand('remove', async (config) => {
  const { status: monorepo, file: workspaceFile, workspaceConfig } = config.monorepo
  if (monorepo && !workspaceFile) {
    throw new Error('Could not find pnpm-workspace.yaml for the monorepo.')
  }
  const rootFile = await resolvePackageJSON(config.cwd)
  const manifest = await readPackageJSON(rootFile)
  const rootProject: Project = {
    name: manifest.name ?? 'root',
    file: rootFile,
    info: {
      dependencies: manifest.dependencies ?? {},
      devDependencies: manifest.devDependencies ?? {},
      peerDependencies: manifest.peerDependencies ?? {},
      optionalDependencies: manifest.optionalDependencies ?? {},
    },
  }
  const projects = monorepo
    ? [...config.monorepo.package.filter(project => project.file !== rootFile), rootProject]
    : [rootProject]
  const selections = new Map<Project, string[]>()

  // Resolve all targets before modifying any files, so cancellation leaves the project intact.
  for (const pkg of config.packages) {
    const candidates = projects.filter(project => dependencyFields.some(field => Object.hasOwn(project.info[field], pkg)))
    if (!candidates.length) {
      throw new Error(`Dependency "${pkg}" was not found in the project.`)
    }

    // for (const project of candidates) {
    //   if (monorepo && project.file !== rootFile && !project.name) {
    //     throw new Error(`Cannot filter workspace project without a package name: ${project.file}`)
    //   }
    // }

    const selected = candidates.length === 1
      ? candidates
      : await multiselect({
          message: `Select projects to remove "${cyan(pkg)}" from`,
          options: candidates.map((project) => {
            const fields = dependencyFields.filter(field => Object.hasOwn(project.info[field], pkg))

            const declarations = fields.map((field) => {
              const specifier = project.info[field][pkg]!
              const name = catalogName(specifier)

              // | 依赖声明 | 查找位置 |
              // |---|---|
              // | `catalog:` 或 `catalog:default` | 优先 `workspaceConfig.catalog[pkg]`，没有时查 `catalogs.default[pkg]` |
              // | `catalog:react18` | `workspaceConfig.catalogs.react18[pkg]` |
              // | 普通版本，如 `^18.2.0` | 不再查 catalog，返回 `undefined` |
              const catalogVersionRange = name === 'default'
                ? workspaceConfig.catalog?.[pkg] ?? workspaceConfig.catalogs?.default?.[pkg]
                : name === undefined ? undefined : workspaceConfig.catalogs?.[name]?.[pkg]

              return `${field}: ${specifier}${catalogVersionRange ? ` (${catalogVersionRange})` : ''}`
            })

            return {
              value: project,
              label: `${project.name} (${declarations.join(', ')})`,
              // hint: project.file,
            }
          }),
          required: true,
        })

    if (isCancel(selected)) {
      cancel('Removal cancelled.')
      process.exitCode = 1
      return
    }

    for (const project of selected) {
      selections.set(project, [...(selections.get(project) ?? []), pkg])
    }
  }

  for (const [project, packages] of selections) {
    const groups = new Map<string, string[]>()

    for (const pkg of packages) {
      const fields = dependencyFields.filter(field => Object.hasOwn(project.info[field], pkg))
      const flag = fields.length === 1
        ? { dependencies: '-P', devDependencies: '-D', peerDependencies: '--save-peer', optionalDependencies: '-O' }[fields[0]!]
        : ''
      groups.set(flag, [...(groups.get(flag) ?? []), pkg])
    }

    for (const [flag, packages] of groups) {
      const args = [...packages]

      if (flag) {
        args.push(flag)
      }

      if (monorepo) {
        args.push(...(project.file === rootFile ? ['-w'] : ['-F', project.name]))
      }

      const command = resolveCommand(config.detect?.agent ?? 'npm', 'uninstall', args)!
      await executeCommand(command, config)
    }
  }

  await cleanCatalogs(config, rootFile, selections)
})
