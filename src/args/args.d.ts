import type { ArgsDef, ParsedArgs } from 'citty'
import type { CommandArgs } from '../types.ts'

export type OptionsArgs<T extends ArgsDef = CommandArgs> = ParsedArgs<CommandArgs<T>>
