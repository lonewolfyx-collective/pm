import type { ArgsDef } from 'citty'

export const lock = {
  lock: {
    type: 'boolean',
    description: 'Also remove the lockfile during cleanup',
    default: false,
  },
} as const satisfies ArgsDef
