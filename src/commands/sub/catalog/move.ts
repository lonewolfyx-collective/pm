import { cancel, isCancel, select, text } from '@clack/prompts'
import { defineCommand } from 'citty'
import { isMap } from 'yaml'
import { defaultArgs } from '../../../args/default.ts'
import { catalogName, dependencyFields, readCatalogWorkspace, saveCatalogWorkspace } from '../../../catalog/workspace.ts'
import { resolveConfig } from '../../../config.ts'

export default defineCommand({
  meta: {
    name: 'move',
    description: 'Move a package in the catalog',
  },
  args: {
    ...defaultArgs,
    to: {
      type: 'string',
      description: 'Destination catalog name',
      default: '',
    },
  },
  async run(ctx) {
    const config = await resolveConfig(ctx.args)
    if (config.packages.length > 1) {
      throw new Error('Specify one dependency at a time.')
    }
    const workspace = await readCatalogWorkspace(config)
    const name = config.packages[0]
    const options = workspace.catalogs.flatMap(catalog => catalog.entries.items
      .map(entry => ({ catalog, dependency: String(entry.key) })))
      .filter(entry => !name || entry.dependency === name)
    if (!options.length) {
      throw new Error(name ? `Dependency "${name}" was not found in any catalog.` : 'No catalog dependencies were found.')
    }
    const entry = name && options.length === 1
      ? options[0]!
      : await select({
          message: 'Select a catalog dependency',
          options: options.map(entry => ({
            value: entry,
            label: `${entry.dependency} (${entry.catalog.name})`,
            hint: String(entry.catalog.entries.get(entry.dependency)),
          })),
        })
    if (isCancel(entry)) {
      cancel('Catalog management cancelled.')
      process.exitCode = 1
      return
    }
    const destination = ctx.args.to || await select({
      message: 'Select the destination catalog',
      options: [
        ...[...new Set(['default', ...workspace.catalogs.map(catalog => catalog.name)])]
          .filter(name => name !== entry.catalog.name)
          .map(name => ({ value: name, label: name })),
        { value: '', label: 'New catalog' },
      ],
    })
    if (isCancel(destination)) {
      cancel('Catalog management cancelled.')
      process.exitCode = 1
      return
    }
    const validate = (name: string | undefined): string | undefined => {
      if (!/^[a-z0-9][\w.-]*$/i.test(name ?? '')) {
        return 'Use letters, digits, dots, underscores or hyphens, starting with a letter or digit.'
      }
    }
    const to = destination || await text({ message: 'Enter the destination catalog name', validate })
    if (isCancel(to)) {
      cancel('Catalog management cancelled.')
      process.exitCode = 1
      return
    }
    const error = validate(to)
    if (error) {
      throw new Error(error)
    }
    if (to === entry.catalog.name) {
      throw new Error('The dependency is already in the destination catalog.')
    }
    const path = workspace.catalogs.find(catalog => catalog.name === to)?.path
      ?? (to === 'default' ? ['catalog'] : ['catalogs', to])
    if (workspace.document.hasIn([...path, entry.dependency])) {
      throw new Error(`Catalog "${to}" already contains "${entry.dependency}".`)
    }
    workspace.document.setIn([...path, entry.dependency], entry.catalog.entries.get(entry.dependency, true))
    workspace.document.deleteIn([...entry.catalog.path, entry.dependency])

    const specifier = to === 'default' ? 'catalog:' : `catalog:${to}`
    for (const { data } of workspace.manifests) {
      for (const field of dependencyFields) {
        const dependencies = data[field]
        if (dependencies && catalogName(dependencies[entry.dependency]) === entry.catalog.name) {
          dependencies[entry.dependency] = specifier
        }
      }
    }
    const overrides = workspace.document.get('overrides')
    if (isMap(overrides)) {
      for (const override of overrides.items) {
        const selector = String(override.key).split('>').pop()!.trim()
        if (catalogName(overrides.get(override.key)) === entry.catalog.name
          && (selector === entry.dependency || selector.startsWith(`${entry.dependency}@`))) {
          overrides.set(override.key, specifier)
        }
      }
    }
    await saveCatalogWorkspace(workspace)
  },
})
