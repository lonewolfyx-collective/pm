import { runCommand } from '../run.ts'

runCommand('clearn', async (config, ctx) => {
  console.log(ctx, config)
  console.log(123)
})
