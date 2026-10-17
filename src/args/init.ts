import type { ArgsDef } from 'citty'

export const initArgs = {
  package: {
    type: 'positional',
    description: 'Project or workspace package name',
    default: '',
  },
  monorepo: {
    type: 'boolean',
    description: 'Select a monorepo workspace to create a project',
    default: false,
  },
  github: {
    type: 'boolean',
    description: 'Initialize the project with CI/CD',
    default: false,
    alias: ['ci', 'ci-cd', 'cd'],
  },
  git: {
    type: 'boolean',
    description: 'git initial',
    default: false,
  },
  dependencies: {
    type: 'boolean',
    description: 'Initialize project dependencies',
    default: false,
    alias: 'p',
  },
} as const satisfies ArgsDef
