import type { initArgs } from '../args/init.ts'
import type { CommandHandler } from '../types.ts'
import { access } from 'node:fs/promises'
import { confirm, isCancel, outro, spinner } from '@clack/prompts'
import { resolvePackageJSON } from 'pkg-types'
import { executeCommand } from '../run.ts'
import { clearDirectory } from '../utils.ts'

export const createProject: CommandHandler<typeof initArgs> = async (config) => {
  const packageJsonExists = await access(await resolvePackageJSON(config.cwd))
    .then(() => true)
    .catch(() => false)

  if (packageJsonExists) {
    const shouldOverwrite = await confirm({
      message: 'A project already exists in the current directory. Overwrite it with a new project? (All files in the current directory will be deleted.)',
    })

    if (isCancel(shouldOverwrite) || !shouldOverwrite) {
      outro('Operation cancelled.')
      return
    }

    await clearDirectory(config.cwd)
  }

  const s = spinner()
  s.start('Init Project...')

  await executeCommand({
    command: 'npx',
    args: ['-y', '@lonewolfyx/setup'],
  }, config)

  s.stop('🎉 Done')
}
