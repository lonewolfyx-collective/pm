import { lock } from '../args/clearn.ts'
import { runCommand } from '../run.ts'

runCommand('clearn', lock, async (config, ctx) => {
  console.log(ctx, config)
  console.log(123)
})
