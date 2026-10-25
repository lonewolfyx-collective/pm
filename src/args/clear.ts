import type { ArgsDef } from 'citty'

export const clearArgs = {
  lockfile: {
    type: 'boolean',
    description: 'Also remove the lockfile during cleanup',
    default: false,
  },
  all: {
    type: 'boolean',
    description: 'Remove all files',
    default: false,
  },
} as const satisfies ArgsDef
