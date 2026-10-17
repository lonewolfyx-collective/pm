import { runPackageScripts } from '@/package.ts'
import { runCommand } from '@/run.ts'

runCommand('dev', async config => await runPackageScripts('dev', config))
