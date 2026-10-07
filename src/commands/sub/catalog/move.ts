import { isCancel, select, text } from '@clack/prompts'
import { defineCommand } from 'citty'
import { defaultArgs } from '../../../args/default.ts'
import {
  cancelCatalog,
  chooseDependency,
  moveCatalogDependency,
  readCatalogWorkspace,
  saveCatalogWorkspace,
  validateCatalogName,
} from '../../../catalog/workspace.ts'
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
    const entry = await chooseDependency(workspace, config.packages[0])
    if (isCancel(entry)) {
      return cancelCatalog()
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
      return cancelCatalog()
    }

    const to = destination || await text({
      message: 'Enter the destination catalog name',
      validate: value => validateCatalogName(value ?? ''),
    })
    if (isCancel(to)) {
      return cancelCatalog()
    }
    const error = validateCatalogName(to)
    if (error) {
      throw new Error(error)
    }
    if (to === entry.catalog.name) {
      throw new Error('The dependency is already in the destination catalog.')
    }

    moveCatalogDependency(workspace, entry.catalog, entry.dependency, to)
    await saveCatalogWorkspace(workspace)
  },
})
