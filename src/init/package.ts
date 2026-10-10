import type { initArgs } from '@/args/init.ts'
import type { CommandHandler } from '@/types.ts'
import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { cancel, confirm, isCancel, outro, text } from '@clack/prompts'
import { choicesTemplate, create, git } from '@lonewolfyx/create'
import { clearDirectory } from '@/utils.ts'

export const createProject: CommandHandler<typeof initArgs> = async (config, ctx) => {
  const projectPath = join(config.cwd, ctx.args.package)

  const packageJsonExists = await access(join(config.cwd, 'package.json'))
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

  const template = await choicesTemplate()

  if (isCancel(template)) {
    cancel('Operation cancelled.')
    return process.exit(0)
  }

  const description = await text({
    message: 'Description',
    placeholder: '',
    defaultValue: '',
  }) as string

  if (isCancel(description)) {
    cancel('Operation cancelled.')
    process.exit(1)
  }

  const context = {
    cwd: config.cwd,
    name: ctx.args.package,
    projectPath,
    description,
    template,
  }

  if (ctx.args.git) {
    await git(context)
  }

  await create(context)
}
