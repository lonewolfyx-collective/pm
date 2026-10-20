import type { ResolveConfig } from '@/types.ts'
import { cancel, isCancel, log, select } from '@clack/prompts'
import { Fzf } from 'fzf'
import { resolveCommand } from 'package-manager-detector'
import { readPackageJSON, resolvePackageJSON } from 'pkg-types'
import { executeCommand } from '@/run.ts'

export async function runPackageScripts(keyword: string, config: ResolveConfig): Promise<void> {
  const filename = await resolvePackageJSON(config.cwd)
  const pkg = await readPackageJSON(filename)
  const scriptNames = Object.keys(pkg.scripts ?? {})

  if (!scriptNames.length) {
    log.warn(`No scripts were found in ${filename}.`)
    return
  }

  const scripts = new Fzf(scriptNames).find(keyword)

  if (!scripts.length) {
    throw new Error(`No scripts matching "${keyword}" were found in ${filename}.`)
  }

  const script = keyword && scripts.length === 1
    ? scripts[0]!.item
    : await select({
        message: keyword ? `Select a ${keyword} script` : 'Select a script',
        options: scripts.map(({ item }) => ({
          value: item,
          label: item,
          hint: pkg.scripts?.[item],
        })),
      })

  if (isCancel(script)) {
    cancel(keyword ? `${keyword.charAt(0).toUpperCase()}${keyword.slice(1)} cancelled.` : 'Run cancelled.')
    process.exitCode = 1
    return
  }

  const command = resolveCommand(config.detect?.agent ?? 'npm', 'run', [script])!
  await executeCommand(command, config)
}
