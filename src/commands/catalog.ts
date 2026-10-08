import { cancel, confirm, isCancel, log, note } from '@clack/prompts'
import { updateWorkspaceManifest } from '@pnpm/workspace.workspace-manifest-writer'
import { cyan, dim } from 'ansis'
import { createMain, defineCommand, showUsage } from 'citty'
import { isMap } from 'yaml'
import { version } from '../../package.json' with { type: 'json' }
import { defaultArgs } from '../args/default.ts'
import { readCatalogWorkspace } from '../catalog/workspace.ts'
import { resolveConfig } from '../config.ts'

const subCommands = {
  move: () => import('./sub/catalog/move.ts').then(r => r.default),
  remove: () => import('./sub/catalog/remove.ts').then(r => r.default),
  rename: () => import('./sub/catalog/rename.ts').then(r => r.default),
}

const spaces = (length: number): string => Array.from({ length }, _ => ` `).join('')

// command: catalog --unUsed/-u
createMain(defineCommand({
  meta: {
    name: 'catalog',
    version,
    description: 'Manage workspace catalogs',
  },
  args: {
    ...defaultArgs,
    unUsed: {
      type: 'boolean',
      description: 'List unused dependencies and catalogs, then confirm removal',
      default: false,
      alias: 'u',
    },
  },
  subCommands,
  async run(ctx) {
    if (ctx.args._[0] && Object.hasOwn(subCommands, ctx.args._[0])) {
      return
    }
    if (!ctx.args.unUsed) {
      return showUsage(ctx.cmd)
    }

    const config = await resolveConfig(ctx.args)
    const workspace = await readCatalogWorkspace(config)

    const dependencies = workspace.catalogs.flatMap(catalog => catalog.entries.items
      .filter(entry => !catalog.used.has(String(entry.key)))
      .map(entry => ({
        dependency: String(entry.key),
        field: 'unused',
        catalog: `${catalog.path.join(':')}${catalog.path.length === 1 ? ':' : ''}`,
        version: String(catalog.entries.get(entry.key)),
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
          version: '',
        })),
      ],
    }]

    const rows = groups.flatMap(group => group.rows)
    const nameWidth = Math.max(...rows.map(row => row.dependency.length))
    const fieldWidth = Math.max(...rows.map(row => row.field.length))
    const catalogWidth = Math.max(...rows.map(row => row.catalog.length))

    note(groups.map(group => [
      `${cyan(group.name)} ${dim(group.file)}`,
      '',
      ...group.rows.map(row => [
        spaces(2),
        row.dependency.padEnd(nameWidth),
        spaces(4),
        dim(row.field.padEnd(fieldWidth)),
        spaces(4),
        dim(row.version ? `${row.catalog.padEnd(catalogWidth)}    ${row.version}` : row.catalog),
      ].join('')),
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

    const { catalog, catalogs: namedCatalogs } = workspace.document.toJSON()
    await updateWorkspaceManifest(config.cwd, {
      updatedFields: { catalog, catalogs: namedCatalogs },
    })
    log.success('Catalogs updated. Run pnpm install to sync the lockfile.')
  },
}))()
