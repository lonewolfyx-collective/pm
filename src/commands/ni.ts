import { cancel, isCancel, log } from '@clack/prompts'
import { cyan } from 'ansis'
import { resolveCommand } from 'package-manager-detector'
import { catalogOptions } from '../catalog.ts'
import { highlightCatalog, selectCatalog, selectDependencies } from '../prompts/catalog.ts'
import { executeCommand, runCommand } from '../run.ts'
import { resolveCatalogName } from '../utils.ts'

runCommand('ni', {
  catalog: {
    type: 'boolean',
    description: 'Assign packages to catalogs using built-in rules and interactive selection (pnpm only)',
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
        catalogOptions,
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
