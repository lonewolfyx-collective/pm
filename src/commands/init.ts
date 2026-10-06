import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { cancel, isCancel, log, select } from '@clack/prompts'
import { runCommand } from '../run.ts'

runCommand('init', {
  monorepo: {
    type: 'boolean',
    description: 'Select a monorepo workspace to initialize readme.md',
    default: false,
  },
}, async (config, ctx) => {
  let cwd = config.cwd

  if (ctx.args.monorepo) {
    const { workspace } = config.monorepo

    if (!workspace.length) {
      throw new Error('No monorepo workspaces are available to initialize.')
    }

    const selected = await select({
      message: 'Select a workspace to initialize',
      options: workspace.map(({ label, path }) => ({ value: path, label })),
    })

    if (isCancel(selected)) {
      cancel('Initialization cancelled.')
      process.exitCode = 1
      return
    }

    cwd = selected
  }

  const file = resolve(cwd, 'readme.md')

  try {
    await writeFile(file, '', { flag: 'wx' })
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      log.warn(`README already exists: ${file}`)
      return
    }

    throw error
  }

  log.success(`Created ${file}`)
})
