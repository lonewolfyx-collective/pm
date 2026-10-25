import type { Output } from 'tinyexec'
import type { ResolveConfig } from '../src/types.ts'
import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
// eslint-disable-next-line test/no-import-node-test -- These tests use Node's built-in test runner.
import { it } from 'node:test'
import { x } from 'tinyexec'

async function run(source: string): Promise<Output> {
  const cwd = await mkdtemp(join(tmpdir(), 'pm-run-'))
  const config: ResolveConfig = {
    cwd,
    detect: { name: 'pnpm', agent: 'pnpm' },
    packages: [],
    monorepo: { status: false, file: '', workspaceConfig: {}, workspace: [], package: [] },
  }

  try {
    await writeFile(join(cwd, 'pnpm'), `#!/usr/bin/env node
process.stdout.write('package manager stdout\\n')
process.stderr.write('package manager stderr\\n')
if (process.argv.includes('install')) {
  process.stdout.write('Ignored build scripts: esbuild, sharp.\\n')
}
if (process.argv.includes('--fail')) {
  process.stderr.write('ERR_PNPM_IGNORED_BUILDS\\n')
  process.exitCode = 1
}
`, { mode: 0o755 })

    return await x(process.execPath, ['--import', 'tsx', '--input-type=module', '--eval', `
      import assert from 'node:assert/strict'
      import { NonZeroExitError } from 'tinyexec'
      import { executeCommand } from './src/run.ts'
      const config = ${JSON.stringify(config)}
      const listeners = process.listenerCount('SIGINT')
      ${source}
      assert.equal(process.listenerCount('SIGINT'), listeners)
    `], {
      nodeOptions: { env: { ...process.env, PATH: `${cwd}${delimiter}${process.env.PATH}` } },
      nodePath: false,
      throwOnError: true,
    })
  }
  finally {
    await rm(cwd, { recursive: true, force: true })
  }
}

it('init package commands keep stdout and stderr silent', async () => {
  const { stdout, stderr } = await run(`
    const { createPackageJSON } = await import('./src/init/task/package.ts')
    await createPackageJSON(config, {})
  `)
  assert.equal(stdout, '')
  assert.equal(stderr, '')
})

it('inherited output is displayed once', async () => {
  const { stdout, stderr } = await run(`
    await executeCommand({ command: 'pnpm', args: ['--version'] }, config)
  `)
  assert.equal(stdout, 'package manager stdout\n')
  assert.equal(stderr, 'package manager stderr\n')
})

it('stdio arrays preserve separate stdout and stderr settings', async () => {
  const { stdout, stderr } = await run(`
    await executeCommand({ command: 'pnpm', args: ['install'] }, config, ['ignore', 'pipe', 'inherit'])
  `)
  assert.equal(stdout, '')
  assert.equal(stderr, 'package manager stderr\n')
})

for (const stdio of ['inherit', 'pipe', 'ignore']) {
  it(`pnpm build detection respects ${stdio} output`, async () => {
    const { stdout, stderr } = await run(`
      const result = await executeCommand({ command: 'pnpm', args: ['install'] }, config, '${stdio}')
      assert.deepEqual(result.ignoredBuilds, ${stdio === 'ignore' ? '[]' : '["esbuild", "sharp"]'})
    `)
    assert.equal(stdout, stdio === 'inherit' ? 'package manager stdout\nIgnored build scripts: esbuild, sharp.\n' : '')
    assert.equal(stderr, stdio === 'inherit' ? 'package manager stderr\n' : '')
  })
}

it('silent command failures retain captured diagnostics and remove SIGINT listeners', async () => {
  const { stdout, stderr } = await run(`
    await assert.rejects(
      executeCommand({ command: 'pnpm', args: ['init', '--fail'] }, config, 'pipe'),
      error => error instanceof NonZeroExitError
        && error.exitCode === 1
        && error.output.stdout.includes('package manager stdout')
        && error.output.stderr.includes('package manager stderr'),
    )
    await assert.rejects(executeCommand({ command: 'pm-command-that-does-not-exist', args: [] }, config, 'pipe'))
  `)
  assert.equal(stdout, '')
  assert.equal(stderr, '')
})

it('ignored build errors still return pending dependencies without displaying piped output', async () => {
  const { stdout, stderr } = await run(`
    const result = await executeCommand({ command: 'pnpm', args: ['install', '--fail'] }, config, 'pipe')
    assert.deepEqual(result.ignoredBuilds, ['esbuild', 'sharp'])
  `)
  assert.equal(stdout, '')
  assert.equal(stderr, '')
})
