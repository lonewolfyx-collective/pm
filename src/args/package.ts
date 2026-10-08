import type { ArgsDef } from 'citty'

export const packageArgs = {
  pkg: {
    type: 'positional',
    description: 'Specify one or more package names',
    default: '',
  },
} as const satisfies ArgsDef
