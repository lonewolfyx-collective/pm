import type { CatalogOption } from './types.ts'

// https://antfu.me/posts/categorize-deps
export const catalogOptions: CatalogOption[] = [
  { value: 'test', label: 'test', hint: 'Testing' },
  {
    value: 'lint',
    label: 'lint',
    hint: 'Linting and formatting',
    packages: ['eslint', '@eslint/*', '@antfu/eslint-config', 'oxlint', 'oxfmt'],
  },
  {
    value: 'build',
    label: 'build',
    hint: 'Building the project',
    packages: ['tsdown', 'vite'],
  },
  { value: 'script', label: 'script', hint: 'Scripting tasks' },
  { value: 'frontend', label: 'frontend', hint: 'Frontend development' },
  { value: 'backend', label: 'backend', hint: 'Backend server' },
  { value: 'types', label: 'types', hint: 'Type checking and definitions' },
  { value: 'inlined', label: 'inlined', hint: 'Dependencies included in the bundle' },
  { value: 'prod', label: 'prod', hint: 'Production runtime dependencies' },
  { value: 'dev', label: 'dev', hint: 'Runtime development dependencies.' },
  { value: 'config', label: 'config', hint: 'Packages for configuration.' },
]
