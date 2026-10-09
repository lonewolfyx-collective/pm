import type { initArgs } from '@/args/init.ts'
import type { CommandHandler } from '@/types.ts'
import { cp, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { downloadTemplate } from 'giget'
import { replaceInFile } from 'replace-in-file'
import { getGithubRepo } from '@/utils.ts'

export const insertProjectGithub: CommandHandler<typeof initArgs> = async (config, _): Promise<void> => {
  const repo = await getGithubRepo(config.cwd).then(({ owner, repo }) => `${owner}/${repo}`)

  const { dir: githubDir } = await downloadTemplate('github:lonewolfyx-workflows/github-workflows', {
    cwd: config.cwd,
    dir: '_github',
    forceClean: true,
  })

  const beforePath = resolve(githubDir, '.github')
  await replaceInFile({
    files: '**/*',
    from: '/{owner}/{repo}/g',
    to: repo,
    glob: {
      cwd: beforePath,
      absolute: true,
    },
  })

  await cp(beforePath, resolve(config.cwd, '.github'), { recursive: true })
  await rm(githubDir, { recursive: true })
}
