import { runCommand } from '../run.ts'

void runCommand('init', async (config, ctx) => {
  console.log(ctx, config)
  console.log(123)
})
