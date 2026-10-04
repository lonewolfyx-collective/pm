import { runCommand } from '../run.ts'

void runCommand('ni', async (config, ctx) => {
  console.log(ctx, config)
  console.log(123)
})
