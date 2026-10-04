import { createMain, defineCommand } from 'citty'

const main = defineCommand({
  meta: {
    name: 'build',
    description: '',
  },
  run() {
    console.log(213)
  },
})

createMain(main)()
