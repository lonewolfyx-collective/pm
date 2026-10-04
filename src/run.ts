import type { ArgsDef } from 'citty'
import type { CommandArgs, CommandHandler, commandMeta, commandOrMeta, PackageManageCommandParameters } from './types.ts'
import { defineCommand, runMain } from 'citty'
import { defaultArgs } from './args/default.ts'
import { resolveConfig } from './config.ts'

export function definePackageManageCommand(command: commandOrMeta, fn: CommandHandler): Promise<void>
export function definePackageManageCommand<const T extends ArgsDef>(command: commandOrMeta, args: T, fn: CommandHandler<T>): Promise<void>
// Parameters reads the last overload, which must cover both call forms.
export function definePackageManageCommand<const T extends ArgsDef>(...args: PackageManageCommandParameters<T>): Promise<void>
export async function definePackageManageCommand(
  ...args: Parameters<typeof definePackageManageCommand>
): Promise<void> {
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
    meta,
    args: commandArgs,
    async run(ctx) {
      const config = await resolveConfig<ArgsDef>(ctx.args)
      await handler(config, ctx)
    },
  })

  await runMain(main)
}
