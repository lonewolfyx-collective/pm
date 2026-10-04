import { runCommand } from '../run.ts'

void runCommand('build', async (config, ctx) => {
  console.log(ctx, config)
  console.log(123)
})
