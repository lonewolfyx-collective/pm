import type { initArgs } from '@/args/init.ts'
import type { CommandHandler } from '@/types.ts'
import { cp, lstat, rm } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { cancel, isCancel, multiselect } from '@clack/prompts'
import { downloadTemplate } from 'giget'
import { glob } from 'glob'
import { replaceInFile } from 'replace-in-file'
import { getGithubRepo } from '@/utils.ts'

export const insertProjectGithub: CommandHandler<typeof initArgs> = async (config, _): Promise<void> => {
  const repo = await getGithubRepo(config.cwd).then(({ owner, repo }) => `${owner}/${repo}`)

  const { dir: githubDir } = await downloadTemplate('github:lonewolfyx-workflows/github-workflows', {
    cwd: config.cwd,
    dir: '_github',
    forceClean: true,
  })

  try {
    const beforePath = resolve(githubDir, '.github')
    const targetPath = resolve(config.cwd, '.github')
    await replaceInFile({
      files: '**/*',
      from: '/{owner}/{repo}/g',
      to: repo,
      glob: {
        cwd: beforePath,
        absolute: true,
      },
    })

    const files = await glob('**/*', { cwd: beforePath, nodir: true, dot: true })
    const conflicts: string[] = []
    for (const file of files.sort()) {
      const exists = await lstat(resolve(targetPath, file))
        .then(() => true)
        .catch((error) => {
          if (error.code === 'ENOENT') {
            return false
          }
          throw error
        })

      if (exists) {
        conflicts.push(file)
      }
    }

    const skipped = new Set<string>()
    if (conflicts.length) {
      const selected = await multiselect({
        message: 'Select existing .github files to replace (deselect all to keep them)',
        options: conflicts.map(file => ({
          value: file,
          label: file,
        })),
        initialValues: conflicts,
        required: false,
      })

      if (isCancel(selected)) {
        cancel('Operation cancelled.')
        return
      }

      for (const file of conflicts) {
        if (!selected.includes(file)) {
          skipped.add(file)
        }
      }
    }

    await cp(beforePath, targetPath, {
      recursive: true,
      filter: source => !skipped.has(relative(beforePath, source)),
    })
  }
  finally {
    await rm(githubDir, { recursive: true })
  }
}
