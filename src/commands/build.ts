import { runPackageScripts } from '@/package.ts'
import { runCommand } from '@/run.ts'

runCommand('build', async config => await runPackageScripts('build', config))
