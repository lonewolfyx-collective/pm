import type { State } from '@clack/core'
import { CANCEL_SYMBOL, MultiSelectPrompt, SelectPrompt, settings, wrapTextWithPrefix } from '@clack/core'
import {
  limitOptions,
  MULTISELECT_INSTRUCTIONS,
  S_BAR,
  S_BAR_END,
  S_CHECKBOX_ACTIVE,
  S_CHECKBOX_INACTIVE,
  S_CHECKBOX_SELECTED,
  S_RADIO_ACTIVE,
  S_RADIO_INACTIVE,
  SELECT_INSTRUCTIONS,
  symbol,
  symbolBar,
} from '@clack/prompts'
import { cyan, dim, gray, green, hex, strikethrough, yellow } from 'ansis'

interface SelectionOption {
  value: string
  label: string
  hint?: string
}

interface SelectionState {
  state: State
  options: SelectionOption[]
  cursor: number
  value: string | string[] | undefined
  error: string
}

export const highlightCatalog = hex('#FFA500').bold

function renderSelection(
  prompt: SelectionState,
  message: string,
  multiple: boolean,
  highlight: (label: string) => string,
): string {
  const guide = settings.withGuide
  const header = `${guide ? `${gray(S_BAR)}\n` : ''}${wrapTextWithPrefix(
    process.stdout,
    message,
    guide ? `${symbolBar(prompt.state)}  ` : '',
    `${symbol(prompt.state)}  `,
  )}\n`
  const values = Array.isArray(prompt.value) ? prompt.value : [prompt.value]

  if (prompt.state === 'submit' || prompt.state === 'cancel') {
    const selected = prompt.options
      .filter(option => values.includes(option.value))
      .map(option => prompt.state === 'submit' ? highlight(option.label) : dim(strikethrough(option.label)))
      .join(', ')
    const result = wrapTextWithPrefix(process.stdout, selected, guide ? `${gray(S_BAR)}  ` : '')
    return `${header}${result}${prompt.state === 'cancel' && guide ? `\n${gray(S_BAR)}` : ''}`
  }

  const prefix = guide ? `${symbolBar(prompt.state)}  ` : ''
  const instructions = multiple ? MULTISELECT_INSTRUCTIONS : SELECT_INSTRUCTIONS
  const footer = [
    `${guide ? `${cyan(S_BAR)}  ` : ''}${instructions.join(' • ')}`,
    ...(guide ? [cyan(S_BAR_END)] : []),
  ]
  const options = limitOptions({
    output: process.stdout,
    options: prompt.options,
    cursor: prompt.cursor,
    columnPadding: guide ? 3 : 0,
    rowPadding: header.split('\n').length + footer.length + (prompt.state === 'error' ? 2 : 1),
    style(option, active): string {
      const selected = values.includes(option.value)
      let marker = active ? green(S_RADIO_ACTIVE) : dim(S_RADIO_INACTIVE)
      if (multiple) {
        marker = active ? cyan(S_CHECKBOX_ACTIVE) : dim(S_CHECKBOX_INACTIVE)
        if (selected) {
          marker = green(S_CHECKBOX_SELECTED)
        }
      }
      const label = active ? option.label : dim(option.label)
      const hint = active && option.hint ? dim(` (${option.hint})`) : ''
      return `${marker} ${label}${hint}`
    },
  })
  const error = prompt.state === 'error' ? `${prefix}${yellow(prompt.error)}\n` : ''
  return `${header}${prefix}${options.join(`\n${prefix}`)}\n${error}${footer.join('\n')}\n`
}

export async function selectCatalog(message: string, options: SelectionOption[]): Promise<string | typeof CANCEL_SYMBOL> {
  return await new SelectPrompt({
    options,
    render(): string {
      return renderSelection(this, message, false, highlightCatalog)
    },
  }).prompt() ?? CANCEL_SYMBOL
}

export async function selectDependencies(message: string, packages: string[]): Promise<string[] | typeof CANCEL_SYMBOL> {
  return await new MultiSelectPrompt({
    options: packages.map(pkg => ({ value: pkg, label: pkg })),
    required: true,
    validate(value): string | undefined {
      if (!value?.length) {
        return 'Please select at least one dependency.'
      }
    },
    render(): string {
      return renderSelection(this, message, true, cyan.bold)
    },
  }).prompt() ?? CANCEL_SYMBOL
}
