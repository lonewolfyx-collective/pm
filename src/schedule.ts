import { spinner } from '@clack/prompts'

interface Schedule {
  step: (startMessage: string, fn: () => Promise<void>, doneMessage: string) => Schedule
  done: () => Promise<void>
}

export function schedule(): Schedule {
  const s = spinner()
  const tasks: Array<{ startMessage: string, fn: () => Promise<void>, doneMessage: string }> = []

  const chain: Schedule = {
    step(startMessage, fn, doneMessage) {
      tasks.push({ startMessage, fn, doneMessage })
      return chain
    },
    async done() {
      for (const { startMessage, fn, doneMessage } of tasks) {
        s.start(startMessage)
        await fn()
        s.stop(doneMessage)
      }
    },
  }

  return chain
}
