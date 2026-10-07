import { cancel, confirm, isCancel, select } from '@clack/prompts'
import { defineCommand } from 'citty'
import { isMap } from 'yaml'
import { defaultArgs } from '../../../args/default.ts'
import { catalogName, dependencyFields, readCatalogWorkspace, saveCatalogWorkspace } from '../../../catalog/workspace.ts'
import { resolveConfig } from '../../../config.ts'

export default defineCommand({
  meta: {
    name: 'remove',
    description: 'Remove a dependency or catalog',
  },
  args: {
    ...defaultArgs,
    catalog: {
      type: 'string',
      description: 'Catalog to remove (omit its value to select)',
      default: '',
    },
  },
  async run(ctx) {
    const config = await resolveConfig(ctx.args)
    const catalogOption = ctx.rawArgs.some(arg => arg === '--catalog' || arg.startsWith('--catalog='))
    if (config.packages.length > 1 || (config.packages.length && catalogOption)) {
      throw new Error('Specify either one dependency or --catalog, not both.')
    }
    const workspace = await readCatalogWorkspace(config)
    const mode = catalogOption
      ? 'catalog'
      : config.packages.length
        ? 'dependency'
        : await select({
            message: 'What would you like to remove?',
            options: [
              { value: 'dependency', label: 'Dependency' },
              { value: 'catalog', label: 'Catalog' },
            ],
          })
    if (isCancel(mode)) {
      cancel('Catalog management cancelled.')
      process.exitCode = 1
      return
    }
    const overrides = workspace.document.get('overrides')

    if (mode === 'dependency') {
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
      if (entry.catalog.used.has(entry.dependency)) {
        const confirmed = await confirm({
          message: `Remove "${entry.dependency}" from catalog "${entry.catalog.name}" and its package.json / override references?`,
          initialValue: false,
        })
        if (isCancel(confirmed) || !confirmed) {
          cancel('Catalog management cancelled.')
          process.exitCode = 1
          return
        }
      }
      workspace.document.deleteIn([...entry.catalog.path, entry.dependency])
      for (const { data } of workspace.manifests) {
        for (const field of dependencyFields) {
          const dependencies = data[field]
          if (dependencies && catalogName(dependencies[entry.dependency]) === entry.catalog.name) {
            delete dependencies[entry.dependency]
          }
        }
      }
      if (isMap(overrides)) {
        for (const override of [...overrides.items]) {
          const selector = String(override.key).split('>').pop()!.trim()
          if (catalogName(overrides.get(override.key)) === entry.catalog.name
            && (selector === entry.dependency || selector.startsWith(`${entry.dependency}@`))) {
            overrides.delete(override.key)
          }
        }
      }
    }
    else {
      if (!workspace.catalogs.length) {
        throw new Error('No catalogs were found.')
      }
      const name = ctx.args.catalog || await select({
        message: 'Select a catalog',
        options: workspace.catalogs.map(catalog => ({ value: catalog.name, label: catalog.name })),
      })
      if (isCancel(name)) {
        cancel('Catalog management cancelled.')
        process.exitCode = 1
        return
      }
      const catalog = workspace.catalogs.find(catalog => catalog.name === name)
      if (!catalog) {
        throw new Error(`Catalog "${name}" was not found.`)
      }
      if (name === 'default' && catalog.used.size) {
        throw new Error('The default catalog is still referenced and cannot be removed.')
      }
      const target = workspace.catalogs.find(catalog => catalog.name === 'default')?.path ?? ['catalog']
      for (const dependency of catalog.used) {
        if (!catalog.entries.has(dependency)) {
          throw new Error(`Referenced dependency "${dependency}" is missing from catalog "${name}".`)
        }
        if (workspace.document.hasIn([...target, dependency])) {
          throw new Error(`Catalog "default" already contains "${dependency}".`)
        }
        workspace.document.setIn([...target, dependency], catalog.entries.get(dependency, true))
      }
      workspace.document.deleteIn(catalog.path)
      for (const { data } of workspace.manifests) {
        for (const field of dependencyFields) {
          const dependencies = data[field]
          for (const [dependency, specifier] of Object.entries(dependencies ?? {})) {
            if (catalogName(specifier) === name) {
              dependencies![dependency] = 'catalog:'
            }
          }
        }
      }
      if (isMap(overrides)) {
        for (const override of overrides.items) {
          if (catalogName(overrides.get(override.key)) === name) {
            overrides.set(override.key, 'catalog:')
          }
        }
      }
    }
    await saveCatalogWorkspace(workspace)
  },
})
