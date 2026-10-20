import { runPackageScripts } from '@/package.ts'
import { runCommand } from '@/run.ts'

runCommand('lint', async config => await runPackageScripts('lint', config))
