import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/commands/*.ts'],
  clean: true,
  dts: true,
  exports: true,
})
