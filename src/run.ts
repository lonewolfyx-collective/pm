import type { ArgsDef } from 'citty'
import type {
  command,
  CommandArgs,
  CommandHandler,
  commandMeta,
  commandOrMeta,
  PackageManageCommandParameters,
  ResolveConfig,
} from './types.ts'
import { defineCommand, runMain } from 'citty'
import { x } from 'tinyexec'
import { version } from '../package.json' with { type: 'json' }
import { defaultArgs } from './args/default.ts'
import { resolveConfig } from './config.ts'

export function runCommand(command: commandOrMeta, fn: CommandHandler): void
export function runCommand<const T extends ArgsDef>(command: commandOrMeta, args: T, fn: CommandHandler<T>): void
export function runCommand<const T extends ArgsDef>(...args: PackageManageCommandParameters<T>): void
export function runCommand(...args: Parameters<typeof runCommand>): void {
  Promise.resolve().then(async () => {
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
  })
}

export async function executeCommand(command: command, config: ResolveConfig): Promise<void> {
  const proc = x(
    command.command,
    command.args,
    {
      nodeOptions: {
        stdio: 'inherit',
        cwd: config.cwd,
      },
      nodePath: false,
      throwOnError: true,
    },
  )

  process.once('SIGINT', async () => {
    // Ensure the proc finishes cleanup before exiting
    await proc
    process.exit(proc.exitCode)
  })

  await proc
}
