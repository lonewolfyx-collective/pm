import type { ArgsDef } from 'citty'
import type { CommandArgs, CommandHandler, commandMeta, commandOrMeta, PackageManageCommandParameters } from './types.ts'
import { defineCommand, runMain } from 'citty'
import { version } from '../package.json' with { type: 'json' }
import { defaultArgs } from './args/default.ts'
import { resolveConfig } from './config.ts'

export function runCommand(command: commandOrMeta, fn: CommandHandler): Promise<void>
export function runCommand<const T extends ArgsDef>(command: commandOrMeta, args: T, fn: CommandHandler<T>): Promise<void>
export function runCommand<const T extends ArgsDef>(...args: PackageManageCommandParameters<T>): Promise<void>
export async function runCommand(...args: Parameters<typeof runCommand>): Promise<void> {
  const command = args[0] as commandOrMeta
  const meta: commandMeta = typeof command === 'string'
    ? { name: command, description: '' }
    : command

  const commandArgs: CommandArgs<ArgsDef> = {
    ...(args.length === 3 ? args[1] : {}),
    ...defaultArgs,
  }
  const handler = (args.length === 2 ? args[1] : args[2]) as CommandHandler<ArgsDef>

  const main = defineCommand<CommandArgs<ArgsDef>>({
    meta: {
      ...meta,
      version,
    },
    args: commandArgs,
    async run(ctx) {
      const config = await resolveConfig<ArgsDef>(ctx.args)
      await handler(config, ctx)
    },
  })

  await runMain(main)
}
