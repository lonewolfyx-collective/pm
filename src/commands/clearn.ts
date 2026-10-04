import { runCommand } from '../run.ts'

void runCommand('clearn', async (config, ctx) => {
  console.log(ctx, config)
  console.log(123)
})
