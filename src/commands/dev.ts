import { runCommand } from '../run.ts'

void runCommand('dev', async (config, ctx) => {
  console.log(ctx, config)
  console.log(123)
})
