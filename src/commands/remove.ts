import type { ResolveConfig } from '../types.ts'
import { readFile } from 'node:fs/promises'
import { cancel, isCancel, multiselect } from '@clack/prompts'
import { resolveCommand } from 'package-manager-detector'
import { readPackageJSON, resolvePackageJSON } from 'pkg-types'
import { isMap, parseDocument } from 'yaml'
import { runCommand } from '../run.ts'

type Project = ResolveConfig['monorepo']['package'][number]

const dependencyFields = ['dependencies', 'devDependencies', 'optionalDependencies'] as const
const referenceFields = [...dependencyFields, 'peerDependencies'] as const

function catalogName(specifier: string | undefined): string | undefined {
  return specifier?.startsWith('catalog:') ? specifier.slice('catalog:'.length) || 'default' : undefined
}

export async function cleanCatalogs(
  workspaceFile: string,
  files: string[],
  catalogs: Map<string, Set<string>>,
  removals: Map<string, string[]>,
): Promise<{ changed: boolean, content: string }> {
  const source = await readFile(workspaceFile, 'utf8')
  const document = parseDocument(source)
  if (document.errors.length) {
    throw document.errors[0]
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
        if (name !== undefined) {
          const packages = referenced.get(name) ?? new Set<string>()
          packages.add(pkg)
          referenced.set(name, packages)
        }
      }
    }
  }
  const overrides = document.get('overrides', true)
  const isReferenced = (name: string, pkg?: string): boolean => {
    return (pkg === undefined ? referenced.has(name) : referenced.get(name)?.has(pkg) === true)
      || (isMap(overrides) && overrides.items.some((entry) => {
        const selector = String(entry.key).split('>').pop()!.trim()
        return catalogName(String(entry.value)) === name
          && (pkg === undefined || selector === pkg || selector.startsWith(`${pkg}@`))
      }))
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
    if (!isReferenced(name)) {
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
      if (!isReferenced(String(entry.key)) && (value == null || (isMap(value) && !value.items.length))) {
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
  return { changed, content: changed ? document.toString() : source }
}

runCommand('remove', async (config) => {
  const { status: monorepo, file: workspaceFile, workspaceConfig } = config.monorepo
  if (monorepo && !workspaceFile) {
    throw new Error('Could not find pnpm-workspace.yaml for the monorepo.')
  }
  const rootFile = await resolvePackageJSON(config.cwd)
  const selections = new Map<Project, string[]>()
  let rootProject: Project | undefined

  // Resolve all targets before modifying any files, so cancellation leaves the project intact.
  for (const pkg of config.packages) {
    let candidates = monorepo
      ? config.monorepo.package.filter(project => dependencyFields.some(field => Object.hasOwn(project.info[field], pkg)))
      : []

    // Only inspect the root manifest when no workspace package declares the dependency.
    if (!candidates.length) {
      if (!rootProject) {
        const manifest = await readPackageJSON(rootFile)
        rootProject = {
          name: manifest.name ?? 'root',
          file: rootFile,
          info: {
            dependencies: manifest.dependencies ?? {},
            devDependencies: manifest.devDependencies ?? {},
            optionalDependencies: manifest.optionalDependencies ?? {},
          },
        }
      }
      if (dependencyFields.some(field => Object.hasOwn(rootProject!.info[field], pkg))) {
        candidates = [rootProject]
      }
    }
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
          message: `Select projects to remove "${pkg}" from`,
          options: candidates.map((project) => {
            const fields = dependencyFields.filter(field => Object.hasOwn(project.info[field], pkg))

            const declarations = fields.map((field) => {
              const specifier = project.info[field][pkg]
              const name = catalogName(specifier)
              // TODO 不理解的逻辑
              const version = name === 'default'
                ? workspaceConfig.catalog?.[pkg] ?? workspaceConfig.catalogs?.default?.[pkg]
                : name === undefined ? undefined : workspaceConfig.catalogs?.[name]?.[pkg]
              return `${field}: ${specifier}${version ? ` (${version})` : ''}`
            })

            return {
              value: project,
              label: `${project.name} (${declarations.join(', ')})`,
              hint: project.file,
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

  const catalogs = new Map<string, Set<string>>()
  for (const [project, packages] of selections) {
    const groups = new Map<string, string[]>()
    for (const pkg of packages) {
      const fields = dependencyFields.filter(field => Object.hasOwn(project.info[field], pkg))
      const flag = fields.length === 1
        ? { dependencies: '-P', devDependencies: '-D', optionalDependencies: '-O' }[fields[0]!]
        : ''
      groups.set(flag, [...(groups.get(flag) ?? []), pkg])

      for (const field of fields) {
        const name = catalogName(project.info[field][pkg])
        if (name !== undefined) {
          const entries = catalogs.get(name) ?? new Set<string>()
          entries.add(pkg)
          catalogs.set(name, entries)
        }
      }
    }
    for (const [flag, packages] of groups) {
      const args = [...packages]
      if (flag && ['pnpm', 'npm'].includes(config.detect?.name ?? 'npm')) {
        args.push(flag)
      }
      if (monorepo) {
        args.push(...(project.file === rootFile ? ['-w'] : ['-F', project.name]))
      }
      const command = resolveCommand(config.detect?.agent ?? 'npm', 'uninstall', args)!
      console.log(command)
      // await executeCommand(command, config)
    }
  }

  if (workspaceFile) {
    const files = [...new Set([rootFile, ...(monorepo ? config.monorepo.package.map(project => project.file) : [])])]
    const removals = new Map([...selections].map(([project, packages]) => [project.file, packages]))
    const { changed, content } = await cleanCatalogs(workspaceFile, files, catalogs, removals)
    console.log('workspace changed', changed, content)
    // if (changed) {
    //   await writeFile(workspaceFile, content)
    // }
  }
})
