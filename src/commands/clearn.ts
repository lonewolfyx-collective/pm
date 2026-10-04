import { createMain, defineCommand } from 'citty'

const main = defineCommand({
  meta: {
    name: 'clearn',
    description: '',
  },
  run() {
    console.log(213)
  },
})

createMain(main)()
