import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { cancel, confirm, isCancel, log, select, text } from '@clack/prompts'
import { runCommand } from '../run.ts'

runCommand('init', {
  package: {
    type: 'positional',
    description: 'package name',
    default: '',
  },
  monorepo: {
    type: 'boolean',
    description: 'Select a monorepo workspace to create a project',
    default: false,
  },
}, async (config, ctx) => {
  let cwd = config.cwd

  if (ctx.args.monorepo) {
    const { workspace, file: workspaceFile } = config.monorepo

    if (!workspace.length) {
      const create = await confirm({
        message: 'No monorepo workspaces found. Create a workspace?',
      })

      if (isCancel(create) || !create) {
        cancel('Initialization cancelled.')
        process.exitCode = 1
        return
      }
    }

    const selected = workspace.length
      ? await select({
          message: 'Select a monorepo workspace to create a project',
          options: workspace.map(({ label, path }) => ({ value: path, label })),
        })
      : await text({
          message: 'Enter the workspace folder name',
          placeholder: 'packages',
          initialValue: 'packages',
          validate(value) {
            const name = value?.trim()
            if (!name) {
              return 'Please enter a workspace folder name.'
            }
            if (['.', '..'].includes(name) || name.includes('/') || name.includes('\\')) {
              return 'Please enter a folder name without path separators.'
            }
          },
        })

    if (isCancel(selected)) {
      cancel('Initialization cancelled.')
      process.exitCode = 1
      return
    }

    cwd = workspace.length
      ? selected
      : resolve(workspaceFile ? dirname(workspaceFile) : config.cwd, selected.trim())

    if (!workspace.length) {
      await mkdir(cwd, { recursive: true })
    }
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
