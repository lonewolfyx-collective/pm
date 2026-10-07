import { cancel, isCancel } from '@clack/prompts'
import { defineCommand } from 'citty'
import { isMap } from 'yaml'
import { defaultArgs } from '../../../args/default.ts'
import { selectCatalog } from '../../../catalog/prompts.ts'
import { catalogOptions } from '../../../catalog/rules.ts'
import { resolveCatalogName } from '../../../catalog/utils.ts'
import { catalogName, dependencyFields, readCatalogWorkspace, saveCatalogWorkspace } from '../../../catalog/workspace.ts'
import { resolveConfig } from '../../../config.ts'

// command: catalog move <pkg...> --to/-to <catalog>
export default defineCommand({
  meta: {
    name: 'move',
    description: 'Move dependencies and their workspace references to catalogs',
  },
  args: {
    ...defaultArgs,
    to: {
      type: 'string',
      description: 'Destination catalog name (omit to use catalog rules)',
      default: '',
      alias: 't',
    },
  },
  async run(ctx) {
    const config = await resolveConfig(ctx.args)
    const workspace = await readCatalogWorkspace(config)
    if (!config.packages.length) {
      throw new Error('Specify at least one dependency to move.')
    }

    const overrides = workspace.document.get('overrides')
    for (const dependency of config.packages) {
      const references = workspace.manifests.flatMap(({ data }) => dependencyFields.flatMap((field) => {
        const dependencies = data[field]
        return Object.hasOwn(dependencies, dependency)
          ? [{
              dependencies,
              value: dependencies[dependency]!,
            }]
          : []
      }))

      if (!references.length) {
        throw new Error(`Dependency "${dependency}" was not found in any package.json.`)
      }

      const overrideKeys = isMap(overrides)
        ? overrides.items.filter((override) => {
            const selector = String(override.key).split('>').pop()!.trim()
            return catalogName(overrides.get(override.key)) !== undefined
              && (selector === dependency || selector.startsWith(`${dependency}@`))
          }).map(override => override.key)
        : []

      const to = ctx.args.to || resolveCatalogName(dependency) || await selectCatalog(
        `Select the destination catalog for ${dependency}`,
        [
          {
            value: 'default',
            label: 'default',
          },
          ...catalogOptions,
          ...(workspace.catalogs.filter(catalog => catalog.name !== 'default'
            && !catalogOptions.some(option => option.value === catalog.name))
            .map(catalog => ({
              value: catalog.name,
              label: catalog.name,
            }))),
        ],
      )

      if (isCancel(to)) {
        cancel('Catalog management cancelled.')
        process.exitCode = 1
        return
      }

      if (!/^[a-z0-9][\w.-]*$/i.test(to)) {
        throw new Error('Use letters, digits, dots, underscores or hyphens, starting with a letter or digit.')
      }

      const path = workspace.catalogs.find(catalog => catalog.name === to)?.path
        ?? (to === 'default' ? ['catalog'] : ['catalogs', to])

      // The current project's manifest comes first, followed by workspace projects.
      const reference = references[0]!
      const from = catalogName(reference.value)
      const version = workspace.document.getIn([...path, dependency])
        ?? (!from
          ? reference.value
          : workspace.catalogs.find(catalog => catalog.name === from)?.entries.get(dependency))

      if (catalogName(version) !== undefined) {
        throw new Error(`Could not resolve a version for "${dependency}" from "${reference.value}".`)
      }

      const sources = new Set(references.map(reference => catalogName(reference.value)))
      if (isMap(overrides)) {
        for (const key of overrideKeys) {
          sources.add(catalogName(overrides.get(key)))
        }
      }

      workspace.document.setIn([...path, dependency], version)

      for (const catalog of workspace.catalogs) {
        if (catalog.name !== to && sources.has(catalog.name)) {
          workspace.document.deleteIn([...catalog.path, dependency])
        }
      }

      const specifier = to === 'default' ? 'catalog:' : `catalog:${to}`
      for (const reference of references) {
        reference.dependencies[dependency] = specifier
      }

      if (isMap(overrides)) {
        for (const key of overrideKeys) {
          overrides.set(key, specifier)
        }
      }
    }

    await saveCatalogWorkspace(workspace)
  },
})
