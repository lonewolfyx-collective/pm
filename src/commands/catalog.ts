import type { CANCEL_SYMBOL } from '@clack/prompts'
import type { Document, YAMLMap } from 'yaml'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, posix } from 'node:path'
import { cancel, confirm, isCancel, log, select, text } from '@clack/prompts'
import { createMain, defineCommand } from 'citty'
import { findUp } from 'find-up'
import { glob } from 'glob'
import { isMap, parseDocument } from 'yaml'
import { version } from '../../package.json' with { type: 'json' }

interface Catalog {
  name: string
  path: string[]
  entries: YAMLMap
}

interface Reference {
  name: string
  dependency: string
  set: (specifier: string) => void
  remove: () => void
}

interface Workspace {
  file: string
  document: Document
  catalogs: Catalog[]
  references: Reference[]
  manifests: {
    file: string
    source: string
    data: Record<string, unknown>
    changed: boolean
  }[]
}

const dependencyFields = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'] as const
const cwdArg = { type: 'string', alias: 'c', description: 'Working directory', default: process.cwd() } as const
const dependencyArg = { type: 'positional', required: false, description: 'Dependency to manage' } as const
const toArg = { type: 'string', description: 'Destination catalog name' } as const

function catalogName(specifier: unknown): string | undefined {
  return typeof specifier === 'string' && specifier.startsWith('catalog:')
    ? specifier.slice('catalog:'.length) || 'default'
    : undefined
}

function catalogPath(document: Document, name: string): string[] {
  return name === 'default' && !document.hasIn(['catalogs', 'default']) ? ['catalog'] : ['catalogs', name]
}

function validateName(name: string): string | undefined {
  if (!/^[a-z0-9][\w.-]*$/i.test(name)) {
    return 'Use letters, digits, dots, underscores or hyphens, starting with a letter or digit.'
  }
}

function cancelled(): void {
  cancel('Catalog management cancelled.')
  process.exitCode = 1
}

async function readWorkspace(cwd: string): Promise<Workspace> {
  const file = await findUp('pnpm-workspace.yaml', { cwd })
  if (!file) {
    throw new Error('Could not find pnpm-workspace.yaml.')
  }
  const document = parseDocument(await readFile(file, 'utf8'))
  if (document.errors.length) {
    throw document.errors[0]
  }
  if (!isMap(document.contents)) {
    throw new Error('pnpm-workspace.yaml must contain a mapping.')
  }
  const named = document.get('catalogs')
  if (named != null && !isMap(named)) {
    throw new Error('catalogs must contain a mapping.')
  }
  if (document.has('catalogs') && named == null) {
    document.set('catalogs', document.createNode({}))
  }
  if (document.has('catalog') && document.hasIn(['catalogs', 'default'])) {
    throw new Error('Define the default catalog using either catalog or catalogs.default, not both.')
  }
  const names = isMap(named) ? named.items.map(entry => String(entry.key)) : []
  if (document.has('catalog')) {
    names.unshift('default')
  }
  const catalogs = names.map((name): Catalog => {
    const path = catalogPath(document, name)
    const node = document.getIn(path)
    if (node != null && !isMap(node)) {
      throw new Error(`Catalog "${name}" must contain a mapping.`)
    }
    const entries: YAMLMap = isMap(node) ? node : document.createNode({})
    if (!isMap(node)) {
      document.setIn(path, entries)
    }
    if (entries.items.some(entry => typeof entries.get(entry.key) !== 'string')) {
      throw new Error(`Catalog "${name}" must contain dependency version strings.`)
    }
    return { name, path, entries }
  })

  const patterns = (document.toJS() as { packages?: unknown }).packages ?? []
  if (!Array.isArray(patterns) || patterns.some(pattern => typeof pattern !== 'string')) {
    throw new Error('packages must be an array of workspace patterns.')
  }
  const excludes = patterns.filter(pattern => pattern.startsWith('!')).map(pattern => posix.normalize(pattern.slice(1)))
  const files = await Promise.all([
    glob('package.json', { cwd: dirname(file), absolute: true, nodir: true }),
    glob(patterns.filter(pattern => !pattern.startsWith('!')).map(pattern => posix.join(pattern, 'package.json')), {
      cwd: dirname(file),
      absolute: true,
      nodir: true,
      ignore: ['**/node_modules/**', '**/.git/**', ...excludes.flatMap(pattern => [pattern, posix.join(pattern, '**')])],
    }),
  ])
  const manifests = await Promise.all([...new Set(files.flat())].sort().map(async (file) => {
    const source = await readFile(file, 'utf8')
    const data = JSON.parse(source) as Record<string, unknown>
    if (!data || Array.isArray(data) || typeof data !== 'object') {
      throw new Error(`Invalid package.json: ${file}`)
    }
    return { file, source, data, changed: false }
  }))
  const references: Reference[] = []
  for (const manifest of manifests) {
    for (const field of dependencyFields) {
      const dependencies = manifest.data[field]
      if (dependencies == null) {
        continue
      }
      if (typeof dependencies !== 'object' || Array.isArray(dependencies)) {
        throw new TypeError(`Invalid ${field} in ${manifest.file}.`)
      }
      for (const [dependency, specifier] of Object.entries(dependencies)) {
        const name = catalogName(specifier)
        if (name !== undefined) {
          references.push({
            name,
            dependency,
            set(specifier) {
              (dependencies as Record<string, string>)[dependency] = specifier
              manifest.changed = true
            },
            remove() {
              delete (dependencies as Record<string, string>)[dependency]
              manifest.changed = true
            },
          })
        }
      }
    }
  }
  const overrides = document.get('overrides', true)
  if (isMap(overrides)) {
    for (const entry of overrides.items) {
      const name = catalogName(overrides.get(entry.key))
      if (name === undefined) {
        continue
      }
      const selector = String(entry.key).split('>').pop()!.trim()
      const dependency = catalogs.find(catalog => catalog.name === name)?.entries.items.map(entry => String(entry.key)).find(pkg => selector === pkg || selector.startsWith(`${pkg}@`))
      if (!dependency) {
        throw new Error(`Cannot resolve catalog dependency for override "${String(entry.key)}".`)
      }
      references.push({
        name,
        dependency,
        set: specifier => overrides.set(entry.key, specifier),
        remove: () => { overrides.delete(entry.key) },
      })
    }
  }
  return { file, document, catalogs, references, manifests }
}

async function chooseCatalog(workspace: Workspace, name: string | undefined): Promise<Catalog | typeof CANCEL_SYMBOL> {
  if (name) {
    const catalog = workspace.catalogs.find(catalog => catalog.name === name)
    if (!catalog) {
      throw new Error(`Catalog "${name}" was not found.`)
    }
    return catalog
  }
  if (!workspace.catalogs.length) {
    throw new Error('No catalogs were found.')
  }
  return select({
    message: 'Select a catalog',
    options: workspace.catalogs.map(catalog => ({ value: catalog, label: catalog.name })),
  })
}

async function chooseDependency(workspace: Workspace, dependency: string | undefined): Promise<{ catalog: Catalog, dependency: string } | typeof CANCEL_SYMBOL> {
  const options = workspace.catalogs.flatMap(catalog => catalog.entries.items
    .map(entry => ({ catalog, dependency: String(entry.key) })))
    .filter(entry => !dependency || entry.dependency === dependency)
  if (!options.length) {
    throw new Error(dependency ? `Dependency "${dependency}" was not found in any catalog.` : 'No catalog dependencies were found.')
  }
  if (dependency && options.length === 1) {
    return options[0]!
  }
  return select({
    message: dependency ? `Select the source catalog for "${dependency}"` : 'Select a catalog dependency',
    options: options.map(entry => ({
      value: entry,
      label: `${entry.dependency} (${entry.catalog.name})`,
      hint: String(entry.catalog.entries.get(entry.dependency)),
    })),
  })
}

function moveDependency(workspace: Workspace, catalog: Catalog, dependency: string, to: string): void {
  const path = [...catalogPath(workspace.document, to), dependency]
  const existing = workspace.document.getIn(path)
  if (existing !== undefined) {
    throw new Error(`Catalog "${to}" already contains "${dependency}".`)
  }
  workspace.document.setIn(path, catalog.entries.get(dependency, true))
  workspace.document.deleteIn([...catalog.path, dependency])
  for (const reference of workspace.references) {
    if (reference.name === catalog.name && reference.dependency === dependency) {
      reference.set(to === 'default' ? 'catalog:' : `catalog:${to}`)
    }
  }
}

async function saveWorkspace(workspace: Workspace): Promise<void> {
  // All prompts and conflict checks finish before any files are written.
  const updates = workspace.manifests.filter(manifest => manifest.changed).map((manifest) => {
    const indent = manifest.source.match(/\n([\t ]+)"/)?.[1] ?? 2
    const newline = manifest.source.includes('\r\n') ? '\r\n' : '\n'
    const source = JSON.stringify(manifest.data, null, indent).replace(/\n/g, newline)
      + (manifest.source.endsWith('\n') ? newline : '')
    return { file: manifest.file, source }
  })
  updates.push({ file: workspace.file, source: workspace.document.toString() })
  for (const update of updates) {
    await writeFile(update.file, update.source)
  }
  log.success('Catalogs updated. Run pnpm install to sync the lockfile.')
}

const main = createMain(defineCommand({
  meta: { name: 'catalog', version, description: 'Manage pnpm workspace catalogs' },
  subCommands: {
    move: defineCommand({
      meta: { description: 'Move a dependency to another catalog' },
      args: { cwd: cwdArg, dependency: dependencyArg, to: toArg },
      async run({ args }) {
        if (args._.length > 1) {
          throw new Error('Specify one dependency at a time.')
        }
        const workspace = await readWorkspace(args.cwd)
        const entry = await chooseDependency(workspace, args.dependency)
        if (isCancel(entry)) {
          return cancelled()
        }
        const selected = args.to || await select({
          message: 'Select the destination catalog',
          options: [
            ...[...new Set(['default', ...workspace.catalogs.map(catalog => catalog.name)])]
              .filter(name => name !== entry.catalog.name)
              .map(name => ({ value: name, label: name })),
            { value: '', label: 'New catalog' },
          ],
        })
        if (isCancel(selected)) {
          return cancelled()
        }
        const to = selected || await text({ message: 'Enter the destination catalog name', validate: value => validateName(value ?? '') })
        if (isCancel(to)) {
          return cancelled()
        }
        const error = validateName(to)
        if (error) {
          throw new Error(error)
        }
        if (to === entry.catalog.name) {
          throw new Error('The dependency is already in the destination catalog.')
        }
        moveDependency(workspace, entry.catalog, entry.dependency, to)
        await saveWorkspace(workspace)
      },
    }),
    remove: defineCommand({
      meta: { description: 'Remove a dependency or catalog' },
      args: {
        cwd: cwdArg,
        dependency: dependencyArg,
        catalog: { type: 'string', description: 'Catalog to remove (omit its value to select)' },
      },
      async run({ args }) {
        if (args._.length > 1 || (args.dependency && args.catalog !== undefined)) {
          throw new Error('Specify either one dependency or --catalog, not both.')
        }
        const workspace = await readWorkspace(args.cwd)
        const mode = args.catalog !== undefined
          ? 'catalog'
          : args.dependency
            ? 'dependency'
            : await select({
                message: 'What would you like to remove?',
                options: [{ value: 'dependency', label: 'Dependency' }, { value: 'catalog', label: 'Catalog' }],
              })
        if (isCancel(mode)) {
          return cancelled()
        }
        if (mode === 'dependency') {
          const entry = await chooseDependency(workspace, args.dependency)
          if (isCancel(entry)) {
            return cancelled()
          }
          const references = workspace.references.filter(reference => reference.name === entry.catalog.name && reference.dependency === entry.dependency)
          if (references.length) {
            const confirmed = await confirm({
              message: `Remove "${entry.dependency}" from catalog "${entry.catalog.name}" and its package.json / override references?`,
              initialValue: false,
            })
            if (isCancel(confirmed) || !confirmed) {
              return cancelled()
            }
            for (const reference of references) {
              reference.remove()
            }
          }
          workspace.document.deleteIn([...entry.catalog.path, entry.dependency])
        }
        else {
          const catalog = await chooseCatalog(workspace, args.catalog)
          if (isCancel(catalog)) {
            return cancelled()
          }
          const references = workspace.references.filter(reference => reference.name === catalog.name)
          if (catalog.name === 'default' && references.length) {
            throw new Error('The default catalog is still referenced and cannot be removed.')
          }
          for (const reference of references) {
            if (!catalog.entries.has(reference.dependency)) {
              throw new Error(`Referenced dependency "${reference.dependency}" is missing from catalog "${catalog.name}".`)
            }
          }
          for (const dependency of new Set(references.map(reference => reference.dependency))) {
            moveDependency(workspace, catalog, dependency, 'default')
          }
          workspace.document.deleteIn(catalog.path)
        }
        await saveWorkspace(workspace)
      },
    }),
    rename: defineCommand({
      meta: { description: 'Rename a catalog and update its references' },
      args: {
        cwd: cwdArg,
        from: { type: 'string', alias: 'form', description: 'Existing catalog name' },
        to: toArg,
      },
      async run({ args }) {
        if (args._.length) {
          throw new Error('Use --from and --to to specify catalog names.')
        }
        const workspace = await readWorkspace(args.cwd)
        const catalog = await chooseCatalog(workspace, args.from)
        if (isCancel(catalog)) {
          return cancelled()
        }
        const to = args.to || await text({ message: 'Enter the new catalog name', validate: value => validateName(value ?? '') })
        if (isCancel(to)) {
          return cancelled()
        }
        const error = validateName(to)
        if (error) {
          throw new Error(error)
        }
        if (workspace.catalogs.some(catalog => catalog.name === to)) {
          throw new Error(`Catalog "${to}" already exists.`)
        }
        workspace.document.setIn(catalogPath(workspace.document, to), catalog.entries)
        workspace.document.deleteIn(catalog.path)
        for (const reference of workspace.references) {
          if (reference.name === catalog.name) {
            reference.set(to === 'default' ? 'catalog:' : `catalog:${to}`)
          }
        }
        await saveWorkspace(workspace)
      },
    }),
  },
}))

// citty string flags need an explicit empty value to reach the interactive flow.
const rawArgs = process.argv.slice(2).map(arg => arg === '-to' ? '--to' : arg)
void main({
  rawArgs: rawArgs.map((arg, index) => ['--catalog', '--from', '--form', '--to'].includes(arg)
    && (!rawArgs[index + 1] || rawArgs[index + 1]!.startsWith('-'))
    ? `${arg}=`
    : arg),
})
