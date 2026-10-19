import type { DefaultTheme, PageData } from 'vitepress'

export function isExternalLink(link: string): boolean {
  return /^(?:[a-z]+:|\/\/)/i.test(link)
}

export function resolveNavLink(link: DefaultTheme.NavItemWithLink['link'], page: PageData): string {
  return typeof link === 'function' ? link(page) : link
}

export function isActiveLink(currentPath: string, link: string, activeMatch?: string): boolean {
  if (isExternalLink(link))
    return false

  if (activeMatch)
    return new RegExp(activeMatch).test(currentPath)

  const target = normalizePath(link.split('#')[0] || '/')
  const current = normalizePath(currentPath)
  return target === '/' ? current === '/' : current === target || current.startsWith(`${target}/`)
}

export function resolveSidebar(
  sidebar: DefaultTheme.Sidebar | undefined,
  currentPath: string,
): DefaultTheme.SidebarItem[] {
  if (!sidebar)
    return []

  if (Array.isArray(sidebar))
    return sidebar

  const matched = Object.keys(sidebar)
    .sort((a, b) => b.length - a.length)
    .find(path => currentPath.startsWith(path))

  if (!matched)
    return []

  const value = sidebar[matched]
  if (!value)
    return []

  if (Array.isArray(value))
    return value

  return value.items.map(item => applySidebarBase(item, value.base))
}

export function flattenSidebar(items: DefaultTheme.SidebarItem[]): DefaultTheme.SidebarItem[] {
  return items.flatMap((item) => {
    const current = item.link ? [item] : []
    return item.items ? [...current, ...flattenSidebar(item.items)] : current
  })
}

function applySidebarBase(item: DefaultTheme.SidebarItem, base: string): DefaultTheme.SidebarItem {
  const ownBase = item.base ?? base
  return {
    ...item,
    link: item.link && !isExternalLink(item.link) ? joinPath(ownBase, item.link) : item.link,
    items: item.items?.map(child => applySidebarBase(child, ownBase)),
  }
}

function joinPath(base: string, path: string): string {
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

function normalizePath(path: string): string {
  return decodeURI(path)
    .replace(/\.html$/, '')
    .replace(/\/index$/, '/')
    .replace(/\/$/, '') || '/'
}
