import { runCommand } from '../run.ts'

runCommand('ni', async (config, ctx) => {
  console.log(ctx, config)
  console.log(123)
})
