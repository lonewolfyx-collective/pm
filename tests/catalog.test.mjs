import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'vitest'
import { parse } from 'yaml'

const cli = fileURLToPath(new URL('../bin/catalog.mjs', import.meta.url))
const prompts = fileURLToPath(new URL('./catalog-prompts.mjs', import.meta.url))

function fixture(t, workspace, manifests = { 'package.json': {} }) {
  const cwd = mkdtempSync(join(tmpdir(), 'pm-catalog-'))
  t.after(() => rmSync(cwd, { recursive: true, force: true }))
  const files = { 'pnpm-workspace.yaml': workspace, ...manifests }
  for (const [file, value] of Object.entries(files)) {
    mkdirSync(dirname(join(cwd, file)), { recursive: true })
    writeFileSync(join(cwd, file), typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`)
  }
  return {
    run(args, answers = []) {
      const result = spawnSync(process.execPath, ['--experimental-test-module-mocks', '--import', prompts, cli, ...args], {
        cwd,
        encoding: 'utf8',
        timeout: 10_000,
        env: { ...process.env, CATALOG_TEST_ANSWERS: JSON.stringify(answers) },
      })
      assert.ifError(result.error)
      return { status: result.status, output: result.stdout + result.stderr }
    },
    read: file => readFileSync(join(cwd, file), 'utf8'),
    manifest: (file = 'package.json') => JSON.parse(readFileSync(join(cwd, file), 'utf8')),
    workspace: () => parse(readFileSync(join(cwd, 'pnpm-workspace.yaml'), 'utf8')),
    snapshot: () => Object.keys(files).map(file => readFileSync(join(cwd, file), 'utf8')),
  }
}

test('move updates every dependency field and overrides, respecting workspace exclusions', (t) => {
  const project = fixture(t, `# workspace settings
packages:
  - packages/*
  - '!packages/excluded'
catalogs:
  build:
    tsdown: ^0.23.0 # keep this version
    vite: ^8.0.0
overrides:
  'parent>tsdown@^0.23.0': catalog:build
`, {
    'package.json': { devDependencies: { tsdown: 'catalog:build' } },
    'packages/app/package.json': {
      dependencies: { tsdown: 'catalog:build' },
      optionalDependencies: { tsdown: 'catalog:build' },
      peerDependencies: { tsdown: 'catalog:build' },
    },
    'packages/excluded/package.json': 'invalid JSON, excluded',
    'packages/app/node_modules/pkg/package.json': 'invalid JSON, ignored',
  })
  const result = project.run(['move', 'tsdown', '--to', 'unbuild', '--cwd', 'packages/app'])
  assert.equal(result.status, 0, result.output)
  assert.equal(project.workspace().catalogs.unbuild.tsdown, '^0.23.0')
  assert.deepEqual(project.workspace().catalogs.build, { vite: '^8.0.0' })
  assert.equal(project.workspace().overrides['parent>tsdown@^0.23.0'], 'catalog:unbuild')
  assert.equal(project.manifest().devDependencies.tsdown, 'catalog:unbuild')
  for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
    assert.equal(project.manifest('packages/app/package.json')[field].tsdown, 'catalog:unbuild')
  }
  assert.match(project.read('pnpm-workspace.yaml'), /# workspace settings/)
  assert.match(project.read('pnpm-workspace.yaml'), /# keep this version/)
})

test('remove catalog discards unused entries and migrates used entries to catalog:', (t) => {
  const project = fixture(t, `catalogs:
  build:
    tsdown: ^0.23.0
    unused: ^1.0.0
    '@scope/tool': ^2.0.0
overrides:
  'parent>@scope/tool@^2': catalog:build
`, { 'package.json': { devDependencies: { tsdown: 'catalog:build' }, dependencies: { other: '^1.0.0' } } })
  const result = project.run(['remove', '--catalog', 'build'])
  assert.equal(result.status, 0, result.output)
  assert.deepEqual(project.workspace().catalog, { 'tsdown': '^0.23.0', '@scope/tool': '^2.0.0' })
  assert.equal(project.workspace().catalogs.build, undefined)
  assert.equal(project.workspace().overrides['parent>@scope/tool@^2'], 'catalog:')
  assert.equal(project.manifest().devDependencies.tsdown, 'catalog:')
  assert.equal(project.manifest().dependencies.other, '^1.0.0')
})

test('rename accepts original spelling and updates only the renamed catalog', (t) => {
  const project = fixture(t, 'catalogs:\n  build:\n    tsdown: ^0.23.0\n  prod:\n    tsdown: ^0.22.0\n', {
    'package.json': { devDependencies: { tsdown: 'catalog:build' }, dependencies: { tsdown: 'catalog:prod' } },
  })
  const result = project.run(['rename', '--form', 'build', '-to', 'unbuild'])
  assert.equal(result.status, 0, result.output)
  assert.equal(project.workspace().catalogs.build, undefined)
  assert.deepEqual(project.workspace().catalogs.unbuild, { tsdown: '^0.23.0' })
  assert.equal(project.manifest().devDependencies.tsdown, 'catalog:unbuild')
  assert.equal(project.manifest().dependencies.tsdown, 'catalog:prod')
})

test('default catalog rename updates both default reference spellings', (t) => {
  const project = fixture(t, 'catalog:\n  tsdown: ^0.23.0\n', {
    'package.json': { devDependencies: { tsdown: 'catalog:' }, peerDependencies: { tsdown: 'catalog:default' } },
  })
  assert.equal(project.run(['rename', '--from', 'default', '--to', 'build']).status, 0)
  assert.equal(project.manifest().devDependencies.tsdown, 'catalog:build')
  assert.equal(project.manifest().peerDependencies.tsdown, 'catalog:build')
  assert.equal(project.workspace().catalog, undefined)
})

test('move to default preserves JSON indentation, line endings and unrelated manifests', (t) => {
  const source = '{\r\n    "devDependencies": {\r\n        "tsdown": "catalog:build"\r\n    }\r\n}\r\n'
  const project = fixture(t, 'packages: [packages/*]\ncatalogs:\n  build:\n    tsdown: ^0.23.0\n', {
    'package.json': source,
    'packages/app/package.json': '{"name":"app","dependencies":{"other":"^1"}}',
  })
  const unchanged = project.read('packages/app/package.json')
  const result = project.run(['move', 'tsdown', '--to', 'default'])
  assert.equal(result.status, 0, result.output)
  assert.equal(project.read('package.json'), source.replace('catalog:build', 'catalog:'))
  assert.equal(project.read('packages/app/package.json'), unchanged)
  assert.deepEqual(project.workspace().catalog, { tsdown: '^0.23.0' })
})

test('remove an in-use dependency confirms before deleting only its matching references', (t) => {
  const project = fixture(t, `packages:
  - packages/*
catalogs:
  build:
    tsdown: ^0.23.0
  prod:
    tsdown: ^0.22.0
overrides:
  tsdown: catalog:build
`, {
    'package.json': { devDependencies: { tsdown: 'catalog:build', vite: '^8.0.0' }, dependencies: { tsdown: 'catalog:prod' } },
    'packages/app/package.json': { optionalDependencies: { tsdown: 'catalog:build' }, peerDependencies: { tsdown: 'catalog:build' } },
  })
  const before = project.snapshot()
  assert.equal(project.run(['remove', 'tsdown'], ['tsdown (build)', false]).status, 1)
  assert.deepEqual(project.snapshot(), before)
  const result = project.run(['remove', 'tsdown'], ['tsdown (build)', true])
  assert.equal(result.status, 0, result.output)
  assert.deepEqual(project.manifest().devDependencies, { vite: '^8.0.0' })
  assert.equal(project.manifest().dependencies.tsdown, 'catalog:prod')
  assert.deepEqual(project.manifest('packages/app/package.json'), { optionalDependencies: {}, peerDependencies: {} })
  assert.equal(project.workspace().catalogs.build.tsdown, undefined)
  assert.equal(project.workspace().catalogs.prod.tsdown, '^0.22.0')
  assert.deepEqual(project.workspace().overrides, {})
})

test('interactive remove distinguishes dependencies from catalogs; bare --catalog selects directly', (t) => {
  const project = fixture(t, 'catalogs:\n  build:\n    tsdown: ^0.23.0\n  empty: {}\n')
  const dependency = project.run(['remove'], ['Dependency', 'tsdown (build)'])
  assert.equal(dependency.status, 0, dependency.output)
  assert.match(dependency.output, /What would you like to remove/)
  assert.equal(project.run(['remove'], ['Catalog', 'empty']).status, 0)
  const catalog = project.run(['remove', '--catalog'], ['build'])
  assert.equal(catalog.status, 0, catalog.output)
  assert.doesNotMatch(catalog.output, /What would you like to remove/)
})

test('interactive move can create a destination, and rename accepts missing option values', (t) => {
  const project = fixture(t, 'catalog:\n  tsdown: ^0.23.0\n')
  const move = project.run(['move'], ['tsdown (default)', 'New catalog', 'build'])
  assert.equal(move.status, 0, move.output)
  const rename = project.run(['rename', '--from', '--to'], ['build', 'unbuild'])
  assert.equal(rename.status, 0, rename.output)
  assert.equal(project.workspace().catalogs.unbuild.tsdown, '^0.23.0')
})

test('target conflicts leave every file unchanged, including late migration conflicts', (t) => {
  const project = fixture(t, `catalog:
  vite: ^7.0.0
catalogs:
  build:
    tsdown: ^0.23.0
    vite: ^8.0.0
  other:
    tsdown: ^0.23.0
`, { 'package.json': { devDependencies: { tsdown: 'catalog:build', vite: 'catalog:build' } } })
  const before = project.snapshot()
  for (const args of [
    ['move', 'tsdown', '--to', 'other'],
    ['rename', '--from', 'build', '--to', 'other'],
    ['remove', '--catalog', 'build'],
  ]) {
    const result = project.run(args, args[0] === 'move' ? ['tsdown (build)'] : [])
    assert.equal(result.status, 1, result.output)
    assert.match(result.output, /already contains|already exists/)
    assert.deepEqual(project.snapshot(), before)
  }
})

test('cancelling each interactive step leaves files unchanged', (t) => {
  const project = fixture(t, 'catalogs:\n  build:\n    tsdown: ^0.23.0\n', {
    'package.json': { devDependencies: { tsdown: 'catalog:build' } },
  })
  const before = project.snapshot()
  for (const [args, answers] of [
    [['move'], ['cancel']],
    [['move', 'tsdown'], ['cancel']],
    [['move', 'tsdown'], ['New catalog', 'cancel']],
    [['remove'], ['cancel']],
    [['remove'], ['Dependency', 'cancel']],
    [['remove', '--catalog'], ['cancel']],
    [['remove', 'tsdown'], ['cancel']],
    [['rename'], ['cancel']],
    [['rename', '--from', 'build'], ['cancel']],
  ]) {
    assert.equal(project.run(args, answers).status, 1)
    assert.deepEqual(project.snapshot(), before)
  }
})

test('referenced default catalog removal is rejected and malformed inputs never write', (t) => {
  const project = fixture(t, 'catalog:\n  tsdown: ^0.23.0\n', {
    'package.json': { devDependencies: { tsdown: 'catalog:' } },
  })
  const before = project.snapshot()
  for (const args of [
    ['remove', '--catalog', 'default'],
    ['move', 'missing', '--to', 'build'],
    ['rename', '--from', 'default', '--to', 'bad name'],
    ['remove', 'tsdown', '--catalog', 'default'],
  ]) {
    assert.equal(project.run(args).status, 1)
    assert.deepEqual(project.snapshot(), before)
  }
  const invalid = fixture(t, 'catalogs:\n  build:\n    tsdown: [invalid]\n')
  const unchanged = invalid.snapshot()
  assert.equal(invalid.run(['remove', 'tsdown']).status, 1)
  assert.deepEqual(invalid.snapshot(), unchanged)
})
