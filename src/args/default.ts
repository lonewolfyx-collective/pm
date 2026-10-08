import type { ArgsDef } from 'citty'

export const defaultArgs = {
  cwd: {
    type: 'string',
    description: 'Specify the working directory',
    alias: 'c',
    default: process.cwd(),
  },
} as const satisfies ArgsDef
