import { runPackageScript } from '@/package.ts'
import { runCommand } from '@/run.ts'

runCommand('dev', async config => await runPackageScript('dev', config))
