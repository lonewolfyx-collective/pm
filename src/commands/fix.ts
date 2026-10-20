import { runPackageScripts } from '@/package.ts'
import { runCommand } from '@/run.ts'

runCommand('fix', async config => await runPackageScripts('fix', config))
