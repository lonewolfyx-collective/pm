import { cancel, isCancel, select, text } from '@clack/prompts'
import { defineCommand } from 'citty'
import { isMap } from 'yaml'
import { defaultArgs } from '../../../args/default.ts'
import { catalogName, dependencyFields, readCatalogWorkspace, saveCatalogWorkspace } from '../../../catalog/workspace.ts'
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
    },
    to: {
      type: 'string',
      description: 'Destination catalog name',
      default: '',
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
    if (workspace.catalogs.some(catalog => catalog.name === to)) {
      throw new Error(`Catalog "${to}" already exists.`)
    }
    workspace.document.setIn(to === 'default' ? ['catalog'] : ['catalogs', to], catalog.entries)
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
    await saveCatalogWorkspace(workspace)
  },
})
