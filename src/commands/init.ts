import { runCommand } from '../run.ts'

runCommand('init', async (config, ctx) => {
  console.log(ctx, config)
  console.log(123)
})
