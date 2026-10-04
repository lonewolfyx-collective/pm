import type { ParsedArgs } from 'citty'
import type { defaultArgs } from './default.ts'

export type OptionsArgs = ParsedArgs<typeof defaultArgs>
