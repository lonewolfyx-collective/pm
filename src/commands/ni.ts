import { resolveCommand } from 'package-manager-detector'
import { executeCommand, runCommand } from '../run.ts'

runCommand('ni', async (config, ctx) => {
  const args = [...config.packages]

  if (ctx.args.devDependencies) {
    args.push('-D')
  }

  if (ctx.args.optionalDependencies) {
    args.push('-o')
  }

  if (ctx.args.catalogName) {
    // TODO check version validate
    args.push(
      '--save-catalog',
      '--save-catalog-name',
      ctx.args.catalogName,
    )
  }

  const command = config.packages.length ? 'add' : 'install'

  const resolvedCommand = resolveCommand(
    config.detect.agent,
    command,
    args,
  )!

  await executeCommand(resolvedCommand, config)
})
