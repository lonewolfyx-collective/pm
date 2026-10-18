import { runCommand } from '@/run.ts'

runCommand('create', async (config, ctx) => {
  console.log(config, ctx)
})
