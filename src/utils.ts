import type { PackageJson } from 'pkg-types'
import type { ResolveConfig } from './types.ts'
import { readdir, rm } from 'node:fs/promises'
import path from 'node:path'

export function normalizeDependencies(pkg: PackageJson): ResolveConfig['monorepo']['package'][number]['info'] {
  return {
    dependencies: pkg.dependencies ?? {},
    devDependencies: pkg.devDependencies ?? {},
    optionalDependencies: pkg.optionalDependencies ?? {},
    peerDependencies: pkg.peerDependencies ?? {},
  }
}

export async function clearDirectory(dirPath: string): Promise<void> {
  const entries = await readdir(dirPath)

  for (const entry of entries) {
    // 保留 .git 目录
    if (entry === '.git') {
      continue
    }

    await rm(path.join(dirPath, entry), { recursive: true, force: true })
  }
}
