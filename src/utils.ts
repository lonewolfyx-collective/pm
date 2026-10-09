import type { PackageJson } from 'pkg-types'
import type { ResolveConfig } from '@/types.ts'
import { readdir, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import { x } from 'tinyexec'

export function normalizeDependencies(pkg: PackageJson): ResolveConfig['monorepo']['package'][number]['info'] {
  return {
    dependencies: pkg.dependencies ?? {},
    devDependencies: pkg.devDependencies ?? {},
    optionalDependencies: pkg.optionalDependencies ?? {},
    peerDependencies: pkg.peerDependencies ?? {},
  }
}

export async function getGithubRepo(cwd: string): Promise<{ owner: string, repo: string }> {
  const repo = {
    owner: '',
    repo: '',
  }

  try {
    if ((await stat(path.join(cwd, '.git'))).isDirectory()) {
      const { stdout } = await x('git', ['remote', 'get-url', 'origin'], {
        nodeOptions: { cwd },
        throwOnError: true,
      })
      const match = stdout.trim().match(/^(?:(?:https?|ssh):\/\/[^/]+\/|[^@\s]+@[^:\s]+:)([^/\s?#]+)\/([^/\s?#]+?)(?:\.git)?\/?$/)

      if (match) {
        return {
          owner: match[1]!,
          repo: match[2]!,
        }
      }
    }
  }
  catch {
    return repo
  }

  return repo
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
