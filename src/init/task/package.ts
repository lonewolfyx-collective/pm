import type { initArgs } from '@/args/init.ts'
import type { CommandHandler } from '@/types.ts'
import { resolvePackageJSON as _resolvePackageJSON, readPackageJSON, writePackageJSON } from 'pkg-types'
import { executeCommand } from '@/run.ts'

export const createPackageJSON: CommandHandler<typeof initArgs> = async (config, _) => {
  await executeCommand({
    command: 'pnpm',
    args: ['init'],
  }, config, 'pipe')

  await executeCommand({
    command: 'pnpm',
    args: [
      '--allow-build=simple-git-hooks',
      'add',
      'eslint',
      '@antfu/eslint-config',
      'jiti',
      'typescript@6',
      '@types/node',
      '@lonewolfyx/tsconfig',
      'simple-git-hooks',
      'lint-staged',
      'verify-git-commit',
      '-D',
    ],
  }, config, 'pipe')
}

export const resolvePackageJSON: CommandHandler<typeof initArgs> = async (config, _) => {
  const packageJSONPath = await _resolvePackageJSON(config.cwd)
  const packageJSON = await readPackageJSON(packageJSONPath)

  if (Object.hasOwn(packageJSON, 'devEngines')) {
    delete packageJSON.devEngines
  }

  if (Object.hasOwn(packageJSON, 'main')) {
    delete packageJSON.main
  }

  if (Object.hasOwn(packageJSON, 'version')) {
    packageJSON.version = '0.0.0'
  }

  if (Object.hasOwn(packageJSON, 'license')) {
    packageJSON.license = 'MIT'
  }

  if (Object.hasOwn(packageJSON, 'author')) {
    packageJSON.author = `lonewolfyx <https://github.com/lonewolfyx>`
  }

  if (Object.hasOwn(packageJSON, 'scripts')) {
    packageJSON.scripts = {
      'lint': 'eslint --cache .',
      'lint:fix': 'eslint --fix',
      'prepublishOnly': 'pnpm build',
      'prepare': 'simple-git-hooks',
    }
  }

  packageJSON['simple-git-hooks'] ??= {
    'pre-commit': 'npx nano-staged',
    'commit-msg': 'npx verify-git-commit',
  }
  packageJSON['lint-staged'] = {
    '*': 'eslint --fix',
  }

  await writePackageJSON(packageJSONPath, packageJSON)
}
