import type { initArgs } from '@/args/init.ts'
import type { CommandHandler } from '@/types.ts'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { executeCommand } from '@/run.ts'

export const createEslintConfig: CommandHandler<typeof initArgs> = async (config, _) => {
  const eslintConfig = `import type { Linter } from 'eslint'
import antfu from '@antfu/eslint-config'

export default antfu({
  pnpm: true,
  type: 'lib',
  typescript: true,
  rules: {
    'no-console': 'off',
    'node/prefer-global/process': 'off',
    'antfu/top-level-function': 'off',
    'regexp/no-unused-capturing-group': 'off',
  },
}) as Linter.Config

`
  await writeFile(resolve(config.cwd, 'eslint.config.ts'), eslintConfig, 'utf-8')

  await executeCommand({
    command: 'pnpm',
    args: [
      'run',
      'lint:fix',
    ],
  }, config, 'pipe')
}
