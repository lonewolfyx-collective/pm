import { runPackageScript } from '@/package.ts'
import { runCommand } from '@/run.ts'

runCommand('build', async config => await runPackageScript('build', config))
