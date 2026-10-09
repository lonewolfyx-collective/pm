import { cancel, isCancel, log } from '@clack/prompts'
import { cyan } from 'ansis'
import { resolveCommand } from 'package-manager-detector'
import { packageArgs } from '@/args/package.ts'
import { highlightCatalog, selectCatalog, selectDependencies } from '@/catalog/prompts.ts'
import { catalogOptions } from '@/catalog/rules.ts'
import { resolveCatalogName } from '@/catalog/utils.ts'
import { executeCommand, runCommand } from '@/run.ts'

runCommand('ni', {
  ...packageArgs,
  devDependencies: {
    type: 'boolean',
    description: 'Install packages as development dependencies',
    alias: ['d', 'D'],
    default: false,
  },
  optionalDependencies: {
    type: 'boolean',
    description: 'Install packages as optional dependencies',
    alias: ['o', 'O'],
    default: false,
  },
  catalog: {
    type: 'boolean',
    description: 'Assign packages to built-in or custom catalogs using rules and interactive selection (pnpm only)',
    default: false,
  },
  catalogName: {
    type: 'string',
    description: 'Save packages to the specified catalog (pnpm only; exclusive with --catalog)',
    default: '',
  },
}, async (config, ctx) => {
  const { catalog, catalogName } = ctx.args

  if (catalog || catalogName) {
    if (config.detect?.name !== 'pnpm') {
      throw new Error('--catalog and --catalog-name are only supported in pnpm projects.')
    }

    if (catalog && catalogName) {
      throw new Error('--catalog and --catalog-name cannot be used together.')
    }

    if (!config.packages.length) {
      throw new Error('--catalog and --catalog-name require at least one package to install.')
    }
  }

  const installArgs: string[] = []

  if (ctx.args.devDependencies) {
    installArgs.push('-D')
  }

  if (ctx.args.optionalDependencies) {
    installArgs.push('-o')
  }

  const groups = new Map<string, string[]>()

  if (catalog) {
    const options = [...catalogOptions]
    let remainingPackages: string[] = []

    for (const pkg of config.packages) {
      const name = resolveCatalogName(pkg)
      if (name) {
        groups.set(name, [...(groups.get(name) ?? []), pkg])
      }
      else {
        remainingPackages.push(pkg)
      }
    }

    for (const [name, packages] of groups) {
      log.info(`Automatically assigned ${cyan.bold(packages.join(', '))} to ${highlightCatalog(`catalog:${name}`)}`)
    }

    while (remainingPackages.length) {
      const name = await selectCatalog(
        `Select a catalog name (remaining dependencies: ${cyan.bold(remainingPackages.join(', '))})`,
        options,
      )

      if (isCancel(name)) {
        cancel('Installation cancelled.')
        process.exitCode = 1
        return
      }

      const packages = await selectDependencies(
        `Select dependencies for ${highlightCatalog(`catalog:${name}`)}`,
        remainingPackages,
      )

      if (isCancel(packages)) {
        cancel('Installation cancelled.')
        process.exitCode = 1
        return
      }

      groups.set(name, [...(groups.get(name) ?? []), ...packages])
      if (!options.some(option => option.value === name)) {
        options.push({ value: name, label: name, hint: 'Custom catalog' })
      }
      const selectedPackages = new Set(packages)
      remainingPackages = remainingPackages.filter(pkg => !selectedPackages.has(pkg))
    }
  }
  else {
    groups.set(catalogName, config.packages)
  }

  const command = config.packages.length ? 'add' : 'install'

  for (const [name, packages] of groups) {
    const args = [...packages, ...installArgs]

    if (name) {
      args.push('--save-catalog', '--save-catalog-name', name)
    }

    const resolvedCommand = resolveCommand(
      config.detect.agent,
      command,
      args,
    )!

    await executeCommand(resolvedCommand, config)
  }
})
