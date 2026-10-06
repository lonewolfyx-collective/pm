import { mock } from 'node:test'
import * as prompts from '@clack/prompts'

const answers = JSON.parse(process.env.CATALOG_TEST_ANSWERS ?? '[]')

function answer(message) {
  console.log(`Prompt: ${message}`)
  if (!answers.length) {
    throw new Error(`Unexpected prompt: ${message}`)
  }
  return answers.shift()
}

mock.module('@clack/prompts', {
  namedExports: {
    ...prompts,
    async select({ message, options }) {
      const value = answer(message)
      if (value === 'cancel') {
        return prompts.CANCEL_SYMBOL
      }
      const option = options.find(option => option.label === value)
      if (!option) {
        throw new Error(`Option not found: ${value}`)
      }
      return option.value
    },
    async text({ message, validate }) {
      const value = answer(message)
      if (value === 'cancel') {
        return prompts.CANCEL_SYMBOL
      }
      const error = validate?.(value)
      if (error) {
        throw new Error(error)
      }
      return value
    },
    async confirm({ message }) {
      const value = answer(message)
      return value === 'cancel' ? prompts.CANCEL_SYMBOL : value
    },
  },
})
