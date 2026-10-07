import { writeFile } from 'node:fs/promises'
import { cancel, confirm, isCancel, log, note } from '@clack/prompts'
import { cyan, dim } from 'ansis'
import { createMain, defineCommand } from 'citty'
import { isMap, isScalar } from 'yaml'
import { version } from '../../package.json' with { type: 'json' }
import { defaultArgs } from '../args/default.ts'
import { readCatalogWorkspace } from '../catalog/workspace.ts'
import { resolveConfig } from '../config.ts'

const subCommands = {
  move: () => import('./sub/catalog/move.ts').then(r => r.default),
  remove: () => import('./sub/catalog/remove.ts').then(r => r.default),
  rename: () => import('./sub/catalog/rename.ts').then(r => r.default),
}

const rawArgs = process.argv.slice(2).map(arg => arg === '-to' ? '--to' : arg)

createMain(defineCommand({
  meta: {
    name: 'catalog',
    version,
    description: 'Manage pnpm workspace catalogs',
  },
  args: {
    ...defaultArgs,
    unUsed: {
      type: 'boolean',
      description: 'List unused dependencies and catalogs, then confirm removal',
      default: false,
    },
  },
  subCommands,
  setup(ctx) {
    if (ctx.args.unUsed && ctx.args._.length) {
      throw new Error('--unUsed cannot be combined with a subcommand.')
    }
  },
  async run(ctx) {
    // if (Object.hasOwn(subCommands, ctx.args.pkg)) {
    //   return
    // }
    // if (!ctx.args.unUsed) {
    //   return showUsage(ctx.cmd)
    // }

    const config = await resolveConfig(ctx.args)
    const workspace = await readCatalogWorkspace(config)

    const dependencies = workspace.catalogs.flatMap(catalog => catalog.entries.items
      .filter(entry => !catalog.used.has(String(entry.key)))
      .map(entry => ({
        dependency: String(entry.key),
        field: 'unused',
        catalog: `${catalog.path.join(':')}${catalog.path.length === 1 ? ':' : ''} ${String(catalog.entries.get(entry.key))}`,
      })))

    const catalogs = workspace.catalogs.filter(catalog => !catalog.used.size)

    if (!dependencies.length && !catalogs.length) {
      log.info('No unused catalog dependencies or catalogs were found.')
      return
    }

    const groups = [{
      name: 'Will be deleted',
      file: 'pnpm-workspace.yaml',
      rows: [
        ...dependencies,
        ...catalogs.map(catalog => ({
          dependency: catalog.name,
          field: 'catalog',
          catalog: `${catalog.path.join(':')}${catalog.path.length === 1 ? ':' : ''}`,
        })),
      ],
    }]

    const overrides = Object.entries(config.monorepo.workspaceConfig.overrides ?? {})
      .flatMap(([dependency, specifier]) => typeof specifier === 'string' && specifier.startsWith('catalog:')
        ? [{
            dependency,
            field: 'override',
            catalog: specifier,
          }]
        : [])

    if (overrides.length) {
      groups.push({ name: 'Workspace references', file: 'pnpm-workspace.yaml (kept)', rows: overrides })
    }

    const rows = groups.flatMap(group => group.rows)
    const nameWidth = Math.max(...rows.map(row => row.dependency.length))
    const fieldWidth = Math.max(...rows.map(row => row.field.length))

    note(groups.map(group => [
      `${cyan(group.name)} ${dim(group.file)}`,
      '',
      ...group.rows.map(row => `  ${row.dependency.padEnd(nameWidth)}  ${dim(row.field.padEnd(fieldWidth))}  ${dim(row.catalog)}`),
    ].join('\n')).join('\n\n'), 'Catalog cleanup')

    const confirmed = await confirm({
      message: 'Delete the entries listed under "Will be deleted"?',
      initialValue: false,
    })

    if (isCancel(confirmed) || !confirmed) {
      cancel('Catalog management cancelled.')
      process.exitCode = 1
      return
    }

    for (const catalog of workspace.catalogs) {
      if (!catalog.used.size) {
        workspace.document.deleteIn(catalog.path)
      }
      else {
        for (const entry of [...catalog.entries.items]) {
          if (!catalog.used.has(String(entry.key))) {
            catalog.entries.delete(entry.key)
          }
        }
      }
    }

    const named = workspace.document.get('catalogs')
    if (isMap(named) && !named.items.length) {
      workspace.document.delete('catalogs')
    }

    if (isMap(workspace.document.contents)) {
      for (const entry of workspace.document.contents.items.slice(1)) {
        if (isScalar(entry.key)) {
          entry.key.spaceBefore = true
        }
      }
    }

    await writeFile(workspace.file, workspace.document.toString(), 'utf-8')
  },
}))({
  rawArgs: rawArgs.map((arg, index) => ['--catalog', '--from', '--form', '--to'].includes(arg)
    && (!rawArgs[index + 1] || rawArgs[index + 1]!.startsWith('-'))
    ? `${arg}=`
    : arg),
})
