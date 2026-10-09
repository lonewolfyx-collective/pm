import { catalogOptions } from '@/catalog/rules.ts'

export function matchesOverrideDependency(key: string, dependency: string): boolean {
  const selector = key.split('>').pop()!.trim()
  return selector === dependency || selector.startsWith(`${dependency}@`)
}

export function resolveCatalogName(packageSpecifier: string): string | undefined {
  // Match registry names (including versions and npm aliases), leaving other sources for manual assignment.
  const registrySpecifier = packageSpecifier
    .replace(/^(?:@[\w.-]+\/)?[\w.-]+@npm:/i, '')
    .replace(/^npm:/, '')
  const packageName = registrySpecifier.match(/^((?:@[\w.-]+\/)?[\w.-]+)(?:@[^/:]+)?$/)?.[1]

  if (!packageName) {
    return undefined
  }

  // The first matching catalog takes precedence if rules overlap.
  return catalogOptions.find(option => option.packages?.some(pattern => pattern.endsWith('*')
    ? packageName.startsWith(pattern.slice(0, -1))
    : packageName === pattern))?.value
}
