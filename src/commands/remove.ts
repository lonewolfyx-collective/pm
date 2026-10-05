import { runCommand } from '../run.ts'

runCommand('remove', async (config, ctx) => {
  console.log(ctx, config)
  console.log(123)
})
