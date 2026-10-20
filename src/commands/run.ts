import { runPackageScripts } from '@/package.ts'
import { runCommand } from '@/run.ts'

runCommand('run', {
  keyword: {
    type: 'positional',
    description: 'Filter package scripts by keyword',
    default: '',
  },
}, async (config, ctx) => await runPackageScripts(ctx.args.keyword, config))
