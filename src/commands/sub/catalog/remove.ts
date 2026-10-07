import { confirm, isCancel, select } from '@clack/prompts'
import { defineCommand } from 'citty'
import { defaultArgs } from '../../../args/default.ts'
import {
  cancelCatalog,
  chooseCatalog,
  chooseDependency,
  moveCatalogDependency,
  readCatalogWorkspace,
  saveCatalogWorkspace,
  updateCatalogReferences,
} from '../../../catalog/workspace.ts'
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
    let mode = catalogOption ? 'catalog' : 'dependency'
    if (!catalogOption && !config.packages.length) {
      const selected = await select({
        message: 'What would you like to remove?',
        options: [
          { value: 'dependency', label: 'Dependency' },
          { value: 'catalog', label: 'Catalog' },
        ],
      })
      if (isCancel(selected)) {
        return cancelCatalog()
      }
      mode = selected
    }

    if (mode === 'dependency') {
      const entry = await chooseDependency(workspace, config.packages[0])
      if (isCancel(entry)) {
        return cancelCatalog()
      }
      const referenced = workspace.references.some(reference => reference.catalog === entry.catalog.name && reference.dependency === entry.dependency)
      if (referenced) {
        const confirmed = await confirm({
          message: `Remove "${entry.dependency}" from catalog "${entry.catalog.name}" and its package.json / override references?`,
          initialValue: false,
        })
        if (isCancel(confirmed) || !confirmed) {
          return cancelCatalog()
        }
        updateCatalogReferences(workspace, entry.catalog.name, entry.dependency)
      }
      workspace.document.deleteIn([...entry.catalog.path, entry.dependency])
    }
    else {
      const catalog = await chooseCatalog(workspace, ctx.args.catalog)
      if (isCancel(catalog)) {
        return cancelCatalog()
      }
      const references = workspace.references.filter(reference => reference.catalog === catalog.name)
      if (catalog.name === 'default' && references.length) {
        throw new Error('The default catalog is still referenced and cannot be removed.')
      }
      for (const reference of references) {
        if (!catalog.entries.has(reference.dependency)) {
          throw new Error(`Referenced dependency "${reference.dependency}" is missing from catalog "${catalog.name}".`)
        }
      }
      for (const dependency of new Set(references.map(reference => reference.dependency))) {
        moveCatalogDependency(workspace, catalog, dependency, 'default')
      }
      workspace.document.deleteIn(catalog.path)
    }

    await saveCatalogWorkspace(workspace)
  },
})
