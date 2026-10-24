import type { initArgs } from '@/args/init.ts'
import type { CommandHandler } from '@/types.ts'
import { outro } from '@clack/prompts'
import { createEslintConfig, createGitignore, createPackageJSON, resolvePackageJSON } from '@/init/task'
import { schedule } from '@/schedule.ts'
import { clearDirectory, isHasPackageJson } from '@/utils.ts'

export const initPackage: CommandHandler<typeof initArgs> = async (config, ctx): Promise<void> => {
  if (await isHasPackageJson(config.cwd)) {
    await clearDirectory(config.cwd)
  }

  await schedule()
    .step(
      'Generating the .gitignore file',
      () => createGitignore(config, ctx),
      'Generated the .gitignore file',
    )
    .step(
      'Initializing package.json and installing development dependencies',
      () => createPackageJSON(config, ctx),
      'Initialized package.json and development dependencies',
    )
    .step(
      'Updating the package.json project configuration',
      () => resolvePackageJSON(config, ctx),
      'Updated the package.json project configuration',
    )
    .step(
      'Generating the ESLint configuration and formatting project files',
      () => createEslintConfig(config, ctx),
      'Generated the ESLint configuration and formatted project files',
    )
    .done()

  outro('✨ Happy create project!')
}
