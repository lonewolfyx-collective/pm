import type { OptionsArgs } from './args/args'
import type { ResolveConfig } from './types.ts'
import { detect } from 'package-manager-detector'

export const resolveConfig = async (options: OptionsArgs): Promise<ResolveConfig> => {
  const detectPM = await detect({
    cwd: options.cwd,
  })

  return {
    cwd: options.cwd,
    detect: detectPM!,
  }
}
