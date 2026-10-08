import { cancel, isCancel, select } from '@clack/prompts'
import { defineCommand } from 'citty'
import { defaultArgs } from '../../../args/default.ts'
import { readCatalogWorkspace, rewriteCatalogReferences, saveCatalogWorkspace } from '../../../catalog/workspace.ts'
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

    const catalogs = workspace.catalogs.filter(catalog => catalog.name !== 'default')

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
      for (const { key, value } of catalog.entries.items) {
        const path = ['catalog', String(key)]
        const existing = workspace.document.getIn(path)
        if (existing !== undefined && existing !== catalog.entries.get(key)) {
          throw new Error(`Catalog "default" already contains a different version of "${String(key)}".`)
        }
        workspace.document.setIn(path, value)
      }
    }

    const resolveSpecifier = (dependency: string): string =>
      destination === 'default' ? 'catalog:' : catalog.entries.get(dependency) as string

    rewriteCatalogReferences(workspace, name, resolveSpecifier)
    workspace.document.deleteIn(catalog.path)

    await saveCatalogWorkspace(workspace)
  },
})
