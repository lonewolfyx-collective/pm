import { cancel, isCancel, select, text } from '@clack/prompts'
import { defineCommand } from 'citty'
import { isMap } from 'yaml'
import { defaultArgs } from '../../../args/default.ts'
import { catalogName, dependencyFields, readCatalogWorkspace } from '../../../catalog/workspace.ts'
import { resolveConfig } from '../../../config.ts'

export default defineCommand({
  meta: {
    name: 'rename',
    description: 'Rename a catalog and update its references',
  },
  args: {
    ...defaultArgs,
    from: {
      type: 'string',
      alias: 'form',
      description: 'Existing catalog name',
      default: '',
      required: true,
    },
    to: {
      type: 'string',
      description: 'Destination catalog name',
      default: '',
      required: true,
    },
  },
  async run(ctx) {
    const config = await resolveConfig(ctx.args)
    if (config.packages.length) {
      throw new Error('Use --from and --to to specify catalog names.')
    }
    const workspace = await readCatalogWorkspace(config)
    if (!workspace.catalogs.length) {
      throw new Error('No catalogs were found.')
    }
    const from = ctx.args.from || await select({
      message: 'Select a catalog',
      options: workspace.catalogs.map(catalog => ({ value: catalog.name, label: catalog.name })),
    })
    if (isCancel(from)) {
      cancel('Catalog management cancelled.')
      process.exitCode = 1
      return
    }
    const catalog = workspace.catalogs.find(catalog => catalog.name === from)
    if (!catalog) {
      throw new Error(`Catalog "${from}" was not found.`)
    }
    const validate = (name: string | undefined): string | undefined => {
      if (!/^[a-z0-9][\w.-]*$/i.test(name ?? '')) {
        return 'Use letters, digits, dots, underscores or hyphens, starting with a letter or digit.'
      }
    }
    const to = ctx.args.to || await text({ message: 'Enter the new catalog name', validate })
    if (isCancel(to)) {
      cancel('Catalog management cancelled.')
      process.exitCode = 1
      return
    }
    const error = validate(to)
    if (error) {
      throw new Error(error)
    }
    if (from === to) {
      throw new Error('The source and destination catalog names must be different.')
    }
    const target = workspace.catalogs.find(catalog => catalog.name === to)
    if (target) {
      const conflict = catalog.entries.items.find((entry) => {
        const dependency = String(entry.key)
        return target.entries.has(dependency)
          && target.entries.get(dependency) !== catalog.entries.get(dependency)
      })
      if (conflict) {
        throw new Error(`Cannot merge catalogs: dependency "${String(conflict.key)}" has different versions in "${from}" and "${to}".`)
      }
      for (const entry of catalog.entries.items) {
        const dependency = String(entry.key)
        if (!target.entries.has(dependency)) {
          target.entries.set(dependency, catalog.entries.get(dependency, true))
        }
      }
    }
    else {
      workspace.document.setIn(to === 'default' ? ['catalog'] : ['catalogs', to], catalog.entries)
    }
    workspace.document.deleteIn(catalog.path)

    const specifier = to === 'default' ? 'catalog:' : `catalog:${to}`
    for (const { data } of workspace.manifests) {
      for (const field of dependencyFields) {
        for (const [dependency, value] of Object.entries(data[field] ?? {})) {
          if (catalogName(value) === from) {
            data[field]![dependency] = specifier
          }
        }
      }
    }
    const overrides = workspace.document.get('overrides')
    if (isMap(overrides)) {
      for (const override of overrides.items) {
        if (catalogName(overrides.get(override.key)) === from) {
          overrides.set(override.key, specifier)
        }
      }
    }

    console.log(JSON.stringify(workspace.manifests, null, 2))
    console.log(workspace.document.toString())
    // await saveCatalogWorkspace(workspace)
  },
})
