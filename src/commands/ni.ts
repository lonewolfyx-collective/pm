import { definePackageManageCommand } from '../run.ts'

void definePackageManageCommand('ni', async (config, ctx) => {
  console.log(ctx, config)
  console.log(123)
})
