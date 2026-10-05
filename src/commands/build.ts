import { cancel, isCancel, select } from '@clack/prompts'
import { Fzf } from 'fzf'
import { resolveCommand } from 'package-manager-detector'
import { readPackageJSON, resolvePackageJSON } from 'pkg-types'
import { executeCommand, runCommand } from '../run.ts'

runCommand('build', async (config) => {
  const filename = await resolvePackageJSON()
  const pkg = await readPackageJSON(filename)
  const scripts = new Fzf(Object.keys(pkg.scripts ?? {})).find('build')

  if (!scripts.length) {
    throw new Error(`No scripts matching "build" were found in ${filename}.`)
  }

  const script = scripts.length === 1
    ? scripts[0]!.item
    : await select({
        message: 'Select a build script',
        options: scripts.map(({ item }) => ({
          value: item,
          label: item,
          hint: pkg.scripts?.[item],
        })),
      })

  if (isCancel(script)) {
    cancel('Build cancelled.')
    process.exitCode = 1
    return
  }

  const command = resolveCommand(config.detect?.agent ?? 'npm', 'run', [script])!
  await executeCommand(command, config)
})
