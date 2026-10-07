import { cancel, confirm, isCancel, log } from '@clack/prompts'
import { createMain, defineCommand, showUsage } from 'citty'
import { isMap } from 'yaml'
import { version } from '../../package.json' with { type: 'json' }
import { defaultArgs } from '../args/default.ts'
import { readCatalogWorkspace, saveCatalogWorkspace } from '../catalog/workspace.ts'
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
    if (Object.hasOwn(subCommands, ctx.args.pkg)) {
      return
    }
    if (!ctx.args.unUsed) {
      return showUsage(ctx.cmd)
    }

    const config = await resolveConfig(ctx.args)
    const workspace = await readCatalogWorkspace(config)
    const dependencies = workspace.catalogs.flatMap(catalog => catalog.entries.items
      .filter(entry => !catalog.used.has(String(entry.key)))
      .map(entry => `${String(entry.key)} (${catalog.name}: ${String(entry.value)})`))
    const catalogs = workspace.catalogs.filter(catalog => !catalog.used.size)
    if (!dependencies.length && !catalogs.length) {
      log.info('No unused catalog dependencies or catalogs were found.')
      return
    }

    log.info(`Unused catalog dependencies:\n${dependencies.length ? dependencies.join('\n') : '(none)'}`)
    log.info(`Unused catalogs:\n${catalogs.length ? catalogs.map(catalog => catalog.name).join('\n') : '(none)'}`)
    const confirmed = await confirm({
      message: 'Delete all listed unused dependencies and catalogs?',
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
    await saveCatalogWorkspace(workspace)
  },
}))({
  rawArgs: rawArgs.map((arg, index) => ['--catalog', '--from', '--form', '--to'].includes(arg)
    && (!rawArgs[index + 1] || rawArgs[index + 1]!.startsWith('-'))
    ? `${arg}=`
    : arg),
})
