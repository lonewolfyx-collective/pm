import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { cancel, confirm, isCancel, log, select, text } from '@clack/prompts'
import { isSeq, parseDocument } from 'yaml'
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
    let { workspace, file: workspaceFile, workspaceConfig } = config.monorepo

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

    if (!workspaceFile) {
      workspaceFile = resolve(config.cwd, 'pnpm-workspace.yaml')
      await writeFile(workspaceFile, '', 'utf-8')
    }

    cwd = workspace.length ? selected : resolve(config.cwd, selected.trim())

    if (!workspace.length) {
      const source = await readFile(workspaceFile, 'utf8')
      const document = parseDocument(source)
      if (document.errors.length) {
        throw document.errors[0]
      }

      const packages = workspaceConfig.packages ?? []
      if (!Array.isArray(packages)) {
        throw new TypeError('The packages field in pnpm-workspace.yaml must be an array.')
      }

      await mkdir(cwd, { recursive: true })

      const pattern = `${selected.trim()}/*`
      if (!packages.includes(pattern)) {
        const node = document.get('packages', true)
        if (isSeq(node)) {
          node.add(pattern)
        }
        else {
          document.set('packages', [...packages, pattern])
        }

        await writeFile(workspaceFile, document.toString(), { flag: workspaceFile ? 'w' : 'wx' })
        workspaceConfig.packages = [...packages, pattern]
      }
    }

    if (!ctx.args.package.trim()) {
      const name = await text({
        message: 'Enter the package name',
        validate(value) {
          if (!value?.trim()) {
            return 'Please enter a package name.'
          }
        },
      })

      if (isCancel(name)) {
        cancel('Initialization cancelled.')
        process.exitCode = 1
        return
      }

      ctx.args = { ...ctx.args, package: name.trim() }
    }

    return
  }

  console.log(123)

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
