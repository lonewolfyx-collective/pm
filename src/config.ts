import type { PnpmWorkspaceSpecification } from '@schemastore/pnpm-workspace'
import type { ArgsDef } from 'citty'
import type { OptionsArgs } from './args/args'
import type { CommandArgs, ResolveConfig } from './types.ts'
import { readFile } from 'node:fs/promises'
import { dirname, posix, resolve } from 'node:path'
import { findUp } from 'find-up'
import { glob, hasMagic } from 'glob'
import { detect } from 'package-manager-detector'
import { readPackageJSON } from 'pkg-types'
import { parse } from 'yaml'

const resolveMonorepo = async (cwd: string): Promise<ResolveConfig['monorepo']> => {
  const monorepo: ResolveConfig['monorepo'] = {
    status: false,
    file: '',
    workspace: [],
    package: [],
    workspaceConfig: {},
  }
  const workspaceFile = await findUp('pnpm-workspace.yaml', { cwd })

  if (!workspaceFile) {
    return monorepo
  }

  const workspace = parse(await readFile(workspaceFile, 'utf8')) as PnpmWorkspaceSpecification
  monorepo.file = workspaceFile
  monorepo.workspaceConfig = workspace ?? {}
  const patterns = workspace?.packages

  if (!Array.isArray(patterns) || !patterns.length) {
    return monorepo
  }

  monorepo.status = true

  const includes = patterns.filter(pattern => !pattern.startsWith('!')).map(pattern => posix.normalize(pattern))
  const excludes = patterns.filter(pattern => pattern.startsWith('!')).map(pattern => posix.normalize(pattern.slice(1)))
  const ignore = ['**/node_modules/**', '**/.git/**', ...excludes.flatMap(pattern => [pattern, posix.join(pattern, '**')])]
  const workspaceRoot = dirname(workspaceFile)
  const files = includes.length
    ? await glob(includes.map(pattern => posix.join(pattern, 'package.json')), {
        cwd: workspaceRoot,
        absolute: true,
        nodir: true,
        ignore,
      })
    : []
  const labels = includes.flatMap((pattern) => {
    const segments = pattern.split('/')
    const wildcardIndex = segments.findIndex(segment => hasMagic(segment, { magicalBraces: true }))
    return wildcardIndex === -1 ? [] : [segments.slice(0, wildcardIndex).join('/') || '.']
  })

  const groups = new Map<string, ResolveConfig['monorepo']['workspace'][number]>()
  for (const label of labels) {
    const path = resolve(workspaceRoot, label)
    if (groups.has(path)) {
      continue
    }
    const directories = await glob(`${label}/`, {
      cwd: workspaceRoot,
      absolute: true,
      ignore,
    })

    if (directories.length) {
      groups.set(path, { label: label === '.' ? 'root' : label, path })
    }
  }

  monorepo.workspace = [...groups.values()]
  monorepo.package = await Promise.all([...new Set(files)].sort().map(async (file) => {
    const pkg = await readPackageJSON(file)
    return {
      name: pkg.name!,
      file,
      info: {
        dependencies: pkg.dependencies ?? {},
        devDependencies: pkg.devDependencies ?? {},
        peerDependencies: pkg.peerDependencies ?? {},
        optionalDependencies: pkg.optionalDependencies ?? {},
      },
    }
  }))

  return monorepo
}

export const resolveConfig = async <T extends ArgsDef = CommandArgs>(options: OptionsArgs<T>): Promise<ResolveConfig> => {
  const detectPM = await detect({
    cwd: options.cwd,
  })

  const packages = [...new Set([options.pkg, ...(options._ ?? [])].filter(Boolean))]

  return {
    cwd: options.cwd,
    detect: detectPM!,
    packages,
    monorepo: await resolveMonorepo(options.cwd),
  }
}
