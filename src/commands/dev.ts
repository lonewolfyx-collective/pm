import { createMain, defineCommand } from 'citty'

const main = defineCommand({
  meta: {
    name: 'dev',
    description: '',
  },
  run() {
    console.log(213)
  },
})

createMain(main)()
