import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { cancel, confirm, isCancel, outro, select, text } from '@clack/prompts'
import { resolvePackageJSON } from 'pkg-types'
import { isSeq, parseDocument } from 'yaml'
import { executeCommand, runCommand } from '../run.ts'
import { clearDirectory } from '../utils.ts'

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
    const { workspace, file: workspaceFile, workspaceConfig } = config.monorepo

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

    const selection = workspace.length
      ? await select({
          message: 'Select a monorepo workspace to create a project',
          options: [
            ...workspace.map(({ label, path }) => ({ value: path, label })),
            { value: '', label: 'Custom workspace', hint: 'Enter a workspace folder name' },
          ],
        })
      : ''

    if (isCancel(selection)) {
      cancel('Initialization cancelled.')
      process.exitCode = 1
      return
    }

    const customWorkspace = selection === ''
    const selected = customWorkspace
      ? await text({
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
      : selection

    if (isCancel(selected)) {
      cancel('Initialization cancelled.')
      process.exitCode = 1
      return
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

    cwd = customWorkspace
      ? resolve(workspaceFile ? dirname(workspaceFile) : config.cwd, selected.trim())
      : selected

    if (customWorkspace) {
      const source = workspaceFile ? await readFile(workspaceFile, 'utf8') : ''
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

        await writeFile(workspaceFile || resolve(config.cwd, 'pnpm-workspace.yaml'), document.toString(), { flag: workspaceFile ? 'w' : 'wx' })
        workspaceConfig.packages = [...packages, pattern]
      }
    }
    return
  }

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

  await executeCommand({
    command: 'npx',
    args: ['-y', '@lonewolfyx/setup'],
  }, config)
})
