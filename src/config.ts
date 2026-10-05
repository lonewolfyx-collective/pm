import type { ArgsDef } from 'citty'
import type { OptionsArgs } from './args/args'
import type { CommandArgs, ResolveConfig } from './types.ts'
import { detect } from 'package-manager-detector'

export const resolveConfig = async <T extends ArgsDef = CommandArgs>(options: OptionsArgs<T>): Promise<ResolveConfig> => {
  const detectPM = await detect({
    cwd: options.cwd,
  })

  const packages = [...new Set([options.pkg, ...(options._ ?? [])].filter(Boolean))]

  return {
    cwd: options.cwd,
    detect: detectPM!,
    packages,
  }
}
