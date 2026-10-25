import type { ArgsDef } from 'citty'
import type { Buffer } from 'node:buffer'
import type { StdioOptions } from 'node:child_process'
import type {
  CommandArgs,
  CommandHandler,
  commandMeta,
  commandOrMeta,
  PackageManageCommandParameters,
  ResolveConfig,
  ResolvedCommand,
} from '@/types.ts'
import { stripVTControlCharacters } from 'node:util'
import { defineCommand, runMain } from 'citty'
import { NonZeroExitError, x } from 'tinyexec'
import { defaultArgs } from '@/args/default.ts'
import { resolveConfig } from '@/config.ts'
import { getIgnoredBuilds } from '@/utils.ts'
import { version } from '../package.json' with { type: 'json' }

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

export async function executeCommand(command: ResolvedCommand, config: ResolveConfig, stdio: StdioOptions = 'inherit'): Promise<{ ignoredBuilds: string[] }> {
  const captureBuilds = config.detect.name === 'pnpm'
    && ['pnpm', 'rush-pnpm'].includes(command.command)
    && ['add', 'install', 'i'].includes(command.args[0] ?? '')
  const forwardOutput = captureBuilds && stdio === 'inherit'

  const proc = x(
    command.command,
    command.args,
    {
      nodeOptions: {
        stdio: forwardOutput ? ['inherit', 'pipe', 'pipe'] : stdio,
        cwd: config.cwd,
      },
      nodePath: false,
      throwOnError: true,
    },
  )

  const chunks: string[] = []
  const onData = (chunk: Buffer | string): void => {
    chunks.push(String(chunk))
  }
  if (captureBuilds) {
    proc.process?.stdout?.on('data', onData)
    proc.process?.stderr?.on('data', onData)
  }

  if (forwardOutput) {
    proc.process?.stdout?.on('data', (chunk: Buffer | string): boolean => process.stdout.write(chunk))
    proc.process?.stderr?.on('data', (chunk: Buffer | string): boolean => process.stderr.write(chunk))
  }

  const onInterrupt = async (): Promise<void> => {
    // Ensure the proc finishes cleanup before exiting
    try {
      await proc
    }
    finally {
      process.exit(proc.exitCode ?? 1)
    }
  }
  process.once('SIGINT', onInterrupt)

  let buildError: NonZeroExitError | undefined
  try {
    await proc
  }
  catch (error) {
    if (!captureBuilds || !(error instanceof NonZeroExitError) || error.signalCode !== null) {
      throw error
    }
    buildError = error
  }
  finally {
    process.off('SIGINT', onInterrupt)
  }

  const output = stripVTControlCharacters(chunks.join(''))
  const ignoredBuilds = getIgnoredBuilds(output)

  if (buildError && (!output.includes('ERR_PNPM_IGNORED_BUILDS') || !ignoredBuilds.length)) {
    throw buildError
  }

  return { ignoredBuilds }
}
