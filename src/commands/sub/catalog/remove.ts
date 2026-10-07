import { cancel, isCancel, select } from '@clack/prompts'
import { defineCommand } from 'citty'
import { isMap } from 'yaml'
import { defaultArgs } from '../../../args/default.ts'
import { dependencyFields, readCatalogWorkspace } from '../../../catalog/workspace.ts'
import { resolveConfig } from '../../../config.ts'

// command: catalog remove --catalog
export default defineCommand({
  meta: {
    name: 'remove',
    description: 'Remove a named catalog and update its references',
  },
  args: {
    ...defaultArgs,
    catalog: {
      type: 'string',
      description: 'Named catalog to remove (omit to select)',
      default: '',
    },
  },
  async run(ctx) {
    const config = await resolveConfig(ctx.args)
    const workspace = await readCatalogWorkspace(config)
    console.log(workspace.catalogs)

    const catalogs = workspace.catalogs.filter(catalog => catalog.name !== 'default')
    console.log(JSON.stringify(workspace, null, 2))

    if (!catalogs.length) {
      throw new Error('No named catalogs were found.')
    }

    const name = ctx.args.catalog || await select({
      message: 'Select a catalog to remove',
      options: catalogs.map(catalog => ({
        value: catalog.name,
        label: catalog.name,
      })),
    })

    if (isCancel(name)) {
      cancel('Catalog management cancelled.')
      process.exit(1)
    }

    const catalog = catalogs.find(catalog => catalog.name === name)
    if (!catalog) {
      throw new Error(`Catalog "${name}" was not found.`)
    }

    const destination = await select({
      message: `How should dependencies from catalog "${name}" be kept?`,
      options: [
        { value: 'default', label: 'Move to the default catalog' },
        { value: 'versions', label: 'Restore versions in package.json and overrides' },
      ],
    })

    if (isCancel(destination)) {
      cancel('Catalog management cancelled.')
      process.exitCode = 1
      return
    }

    if (destination === 'default') {
      for (const entry of catalog.entries.items) {
        const dependency = String(entry.key)
        const path = ['catalog', dependency]
        if (workspace.document.hasIn(path)
          && workspace.document.getIn(path) !== catalog.entries.get(dependency)) {
          throw new Error(`Catalog "default" already contains a different version of "${dependency}".`)
        }
        workspace.document.setIn(path, catalog.entries.get(dependency, true))
      }
    }

    for (const { data } of workspace.manifests) {
      for (const field of dependencyFields) {
        for (const [dependency, specifier] of Object.entries(data[field])) {
          if (specifier !== `catalog:${name}`) {
            continue
          }
          data[field][dependency] = destination === 'default' ? 'catalog:' : catalog.entries.get(dependency) as string
        }
      }
    }

    const overrides = workspace.document.get('overrides')
    if (isMap(overrides)) {
      for (const override of overrides.items) {
        if (overrides.get(override.key) !== `catalog:${name}`) {
          continue
        }
        const selector = String(override.key).split('>').pop()!.trim()
        const dependency = catalog.entries.items.map(entry => String(entry.key))
          .find(dependency => selector === dependency || selector.startsWith(`${dependency}@`))
        const version = dependency && catalog.entries.get(dependency)
        if (typeof version !== 'string') {
          throw new TypeError(`Override "${String(override.key)}" references a dependency missing from catalog "${name}".`)
        }
        overrides.set(override.key, destination === 'default' ? 'catalog:' : version)
      }
    }
    workspace.document.deleteIn(catalog.path)

    console.log(JSON.stringify(workspace, null, 2))

    // await saveCatalogWorkspace(workspace)
  },
})
