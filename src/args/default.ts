import type { ArgsDef } from 'citty'

export const defaultArgs = {
  cwd: {
    type: 'string',
    description: 'Current working directory',
    alias: 'c',
    default: process.cwd(),
  },
} as const satisfies ArgsDef
