import antfu from '@antfu/eslint-config'

export default antfu({
  pnpm: true,
  type: 'lib',
  typescript: true,
  rules: {
    'no-console': 'off',
    'node/prefer-global/process': 'off',
    'antfu/top-level-function': 'off',
    'regexp/no-unused-capturing-group': 'off',
  },
}, {
  files: ['tests/**/*.mjs'],
  rules: {
    'test/no-import-node-test': 'off',
  },
})
