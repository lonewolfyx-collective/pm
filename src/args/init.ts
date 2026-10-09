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
} as const satisfies ArgsDef
