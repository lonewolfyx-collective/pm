import type { ArgsDef } from 'citty'

export const defaultArgs = {
  cwd: {
    type: 'string',
    description: 'Specify the working directory',
    alias: 'c',
    default: process.cwd(),
  },
  pkg: {
    type: 'positional',
    description: 'Specify one or more package names',
    default: '',
  },
  devDependencies: {
    type: 'boolean',
    description: 'Install packages as development dependencies',
    alias: ['d', 'D'],
    default: false,
  },
  optionalDependencies: {
    type: 'boolean',
    description: 'Install packages as optional dependencies',
    alias: ['o', 'O'],
    default: false,
  },
  catalogName: {
    type: 'string',
    description: 'Specify the catalog name',
    alias: '',
    default: '',
  },
} as const satisfies ArgsDef
