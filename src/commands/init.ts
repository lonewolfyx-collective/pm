import type { CommandHandler } from '@/types.ts'
import { initArgs } from '@/args/init.ts'
import { createMonorepo, createProject, initPackage, insertProjectGithub } from '@/init'
import { runCommand } from '@/run.ts'

type InitHandler = CommandHandler<typeof initArgs>

interface InitStrategy {
  matches: (args: Parameters<InitHandler>[1]['args']) => boolean
  run: InitHandler
}

runCommand('init', initArgs, async (config, ctx) => {
  const strategies: InitStrategy[] = [
    {
      matches: args => args.github,
      run: insertProjectGithub,
    },
    {
      matches: args => args.monorepo,
      run: createMonorepo,
    },
    {
      matches: args => !!args.package,
      run: createProject,
    },
    {
      matches: () => true,
      run: initPackage,
    },
  ]

  for (const strategy of strategies) {
    if (strategy.matches(ctx.args)) {
      await strategy.run(config, ctx)
      return
    }
  }
})
