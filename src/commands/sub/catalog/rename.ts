import { isCancel, text } from '@clack/prompts'
import { defineCommand } from 'citty'
import { defaultArgs } from '../../../args/default.ts'
import {
  cancelCatalog,
  catalogPath,
  chooseCatalog,
  readCatalogWorkspace,
  saveCatalogWorkspace,
  updateCatalogReferences,
  validateCatalogName,
} from '../../../catalog/workspace.ts'
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
    const catalog = await chooseCatalog(workspace, ctx.args.from)
    if (isCancel(catalog)) {
      return cancelCatalog()
    }

    const to = ctx.args.to || await text({
      message: 'Enter the new catalog name',
      validate: value => validateCatalogName(value ?? ''),
    })
    if (isCancel(to)) {
      return cancelCatalog()
    }
    const error = validateCatalogName(to)
    if (error) {
      throw new Error(error)
    }
    if (workspace.catalogs.some(catalog => catalog.name === to)) {
      throw new Error(`Catalog "${to}" already exists.`)
    }

    workspace.document.setIn(catalogPath(workspace, to), catalog.entries)
    workspace.document.deleteIn(catalog.path)
    for (const dependency of new Set(workspace.references
      .filter(reference => reference.catalog === catalog.name)
      .map(reference => reference.dependency))) {
      updateCatalogReferences(workspace, catalog.name, dependency, to)
    }
    await saveCatalogWorkspace(workspace)
  },
})
