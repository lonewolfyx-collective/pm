import type { ArgsDef } from 'citty'
import type { OptionsArgs } from './args/args'
import type { CommandArgs, ResolveConfig } from './types.ts'
import { readFile } from 'node:fs/promises'
import { dirname, posix } from 'node:path'
import { findUp } from 'find-up'
import { glob } from 'glob'
import { detect } from 'package-manager-detector'
import { readPackageJSON } from 'pkg-types'
import { parse } from 'yaml'

const resolveMonorepo = async (cwd: string): Promise<ResolveConfig['monorepo']> => {
  const monorepo: ResolveConfig['monorepo'] = {
    status: false,
    packages: [],
    package: [],
  }
  const workspaceFile = await findUp('pnpm-workspace.yaml', { cwd })

  if (!workspaceFile) {
    return monorepo
  }

  const workspace = parse(await readFile(workspaceFile, 'utf8')) as { packages?: unknown }
  const patterns = workspace?.packages

  if (!Array.isArray(patterns) || !patterns.length) {
    return monorepo
  }

  monorepo.status = true
  monorepo.packages = patterns

  const includes = patterns.filter(pattern => !pattern.startsWith('!'))
  const excludes = patterns.filter(pattern => pattern.startsWith('!')).map(pattern => pattern.slice(1))
  const files = await glob(includes.map(pattern => posix.join(pattern, 'package.json')), {
    cwd: dirname(workspaceFile),
    absolute: true,
    nodir: true,
    dot: true,
    ignore: ['**/node_modules/**', '**/.git/**', ...excludes.flatMap(pattern => [pattern, posix.join(pattern, '**')])],
  })

  monorepo.package = await Promise.all([...new Set(files)].sort().map(async (file) => {
    const pkg = await readPackageJSON(file)
    return { name: pkg.name!, file }
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
