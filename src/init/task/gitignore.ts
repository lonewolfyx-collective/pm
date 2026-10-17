import type { initArgs } from '@/args/init.ts'
import type { CommandHandler } from '@/types.ts'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export const createGitignore: CommandHandler<typeof initArgs> = async (config, _) => {
  // const result = await fetch('https://www.toptal.com/developers/gitignore/api/node')
  const result = await fetch('https://raw.githubusercontent.com/github/gitignore/refs/heads/main/Node.gitignore')
  await writeFile(resolve(config.cwd, '.gitignore'), await result.text(), 'utf-8')
}
