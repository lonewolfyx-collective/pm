import type { ArgsDef, CommandContext, CommandMeta as CommandMetaData } from 'citty'
import type { DetectResult } from 'package-manager-detector'
import type { defaultArgs } from './args/default.ts'

export interface ResolveConfig {
  cwd: string
  detect: DetectResult
  packages: string[]
}

export type commandMeta = Required<Pick<CommandMetaData, 'name' | 'description'>>

export type DefaultArgs = typeof defaultArgs

export type CommandArgs<T extends ArgsDef = DefaultArgs> = Omit<T, keyof DefaultArgs> & DefaultArgs

export type CommandHandler<T extends ArgsDef = CommandArgs> = (
  config: ResolveConfig,
  ctx: CommandContext<CommandArgs<T>>,
) => Promise<void>

export type commandOrMeta = string | commandMeta

export type PackageManageCommandParameters<T extends ArgsDef = ArgsDef>
  = | [commandOrMeta: commandOrMeta, fn: CommandHandler]
    | [commandOrMeta: commandOrMeta, args: T, fn: CommandHandler<T>]

export interface command {
  command: string
  args: string[]
}
