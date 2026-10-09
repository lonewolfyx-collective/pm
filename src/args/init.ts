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
} as const satisfies ArgsDef
