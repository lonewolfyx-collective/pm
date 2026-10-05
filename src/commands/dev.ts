import { runCommand } from '../run.ts'

runCommand('dev', async (config, ctx) => {
  console.log(ctx, config)
  console.log(123)
})
