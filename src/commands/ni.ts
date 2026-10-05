import { resolveCommand } from 'package-manager-detector'
import { runCommand } from '../run.ts'

runCommand('ni', async (config, ctx) => {
  console.log(ctx, config)
  console.log(123)

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

  console.log(resolveCommand(
    config.detect.agent,
    command,
    args,
  ))
})
