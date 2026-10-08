import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { cancel, confirm, isCancel, outro, select, spinner, text } from '@clack/prompts'
import { resolvePackageJSON, writePackage } from 'pkg-types'
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

    if (!workspaceFile) {
      workspaceFile = resolve(config.cwd, 'pnpm-workspace.yaml')
      await writeFile(workspaceFile, '', 'utf-8')
    }

    cwd = customWorkspace ? resolve(config.cwd, selected.trim()) : selected

    if (customWorkspace) {
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

        await writeFile(workspaceFile, document.toString())
      }
    }

    const packageDir = resolve(cwd, ctx.args.package)
    await mkdir(packageDir, { recursive: true })

    // TODO 后续可以添加确认是否使用 根目录 下的 package.json name 做为 scope 以及是否自定义 scope。
    // TODO 流程：是否使用 package.json name 作为 scope，否 -> 是否自定义 scope，否 -> 使用默认的 ctx.arg.package

    const s = spinner()
    s.start('workspace package init')

    await writePackage(resolve(packageDir, 'package.json'), {
      name: ctx.args.package,
      type: 'module',
      version: '0.0.0',
      packageManager: 'pnpm@12.8.1',
      description: '',
      author: 'lonewolfyx <https://github.com/lonewolfyx>',
      license: 'MIT',
      funding: 'https://github.com/sponsors/lonewolfyx',
      homepage: `https://github.com/lonewolfyx/${ctx.args.package}#readme`,
      repository: {
        type: 'git',
        url: `git+https://github.com/lonewolfyx/${ctx.args.package}.git`,
        directory: `${selected}/${ctx.args.package}`,
      },
      bugs: `https://github.com/lonewolfyx/${ctx.args.package}/issues`,
      keywords: [],
      sideEffects: false,
      exports: {
        '.': './dist/index.mjs',
        './package.json': './package.json',
      },
      types: './dist/index.d.mts',
      files: [
        'dist',
      ],
    })

    s.stop('workspace package create success 🎉')

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

  const s = spinner()
  s.start('Init Project...')

  await executeCommand({
    command: 'npx',
    args: ['-y', '@lonewolfyx/setup'],
  }, config)

  s.stop('🎉 Done')
})
