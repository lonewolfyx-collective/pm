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
      description: 'Existing catalog name (English letters only)',
      default: '',
      alias: ['f', 'form'],
    },
    to: {
      type: 'string',
      description: 'Destination catalog name (English letters only)',
      default: '',
      required: true,
    },
  },
  async run(ctx) {
    const config = await resolveConfig(ctx.args)
    const workspace = await readCatalogWorkspace(config)
    const catalogs = workspace.catalogs.filter(catalog => catalog.name !== 'default')
    if (!catalogs.length) {
      throw new Error('No named catalogs were found.')
    }

    const from = ctx.args.from || await select({
      message: 'Select a catalog',
      options: catalogs.map(catalog => ({ value: catalog.name, label: catalog.name })),
    })
    if (isCancel(from)) {
      cancel('Catalog management cancelled.')
      process.exit(1)
    }

    const catalog = catalogs.find(catalog => catalog.name === from)
    if (!catalog) {
      throw new Error(`Catalog "${from}" was not found.`)
    }

    const to = ctx.args.to || await text({
      message: 'Enter the new catalog name',
    })
    if (isCancel(to)) {
      cancel('Catalog management cancelled.')
      process.exit(1)
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
