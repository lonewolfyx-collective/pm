import type { ArgsDef } from 'citty'

export const lockfile = {
  lockfile: {
    type: 'boolean',
    description: 'Also remove the lockfile during cleanup',
    default: false,
  },
} as const satisfies ArgsDef
