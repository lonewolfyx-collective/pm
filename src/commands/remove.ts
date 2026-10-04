import { runCommand } from '../run.ts'

void runCommand('remove', async (config, ctx) => {
  console.log(ctx, config)
  console.log(123)
})
