import type { ResolveConfig } from '@/types.ts'
import { cancel, isCancel, select } from '@clack/prompts'
import { Fzf } from 'fzf'
import { resolveCommand } from 'package-manager-detector'
import { readPackageJSON, resolvePackageJSON } from 'pkg-types'
import { executeCommand } from '@/run.ts'

export async function runPackageScript(keyword: string, config: ResolveConfig): Promise<void> {
  const filename = await resolvePackageJSON()
  const pkg = await readPackageJSON(filename)
  const scripts = new Fzf(Object.keys(pkg.scripts ?? {})).find(keyword)

  if (!scripts.length) {
    throw new Error(`No scripts matching "${keyword}" were found in ${filename}.`)
  }

  const script = scripts.length === 1
    ? scripts[0]!.item
    : await select({
        message: `Select a ${keyword} script`,
        options: scripts.map(({ item }) => ({
          value: item,
          label: item,
          hint: pkg.scripts?.[item],
        })),
      })

  if (isCancel(script)) {
    cancel(`${keyword.charAt(0).toUpperCase()}${keyword.slice(1)} cancelled.`)
    process.exitCode = 1
    return
  }

  const command = resolveCommand(config.detect?.agent ?? 'npm', 'run', [script])!
  await executeCommand(command, config)
}
