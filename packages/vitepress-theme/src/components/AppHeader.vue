<script setup lang="ts">
import type { DefaultTheme, LocaleSpecificConfig, VitePressData } from 'vitepress'
import type { ThemeConfig } from '../types'
import { useData, useRoute, withBase } from 'vitepress'
import { computed, shallowRef } from 'vue'
import { isActiveLink, isExternalLink, resolveNavLink } from '../utils/navigation'
import AppLanguageMenu from './AppLanguageMenu.vue'
import UiCross from './ui/UiCross.vue'

defineEmits<{
  openSearch: []
}>()

const data = useData<ThemeConfig>()
const { isDark, localeIndex, page, site, theme } = data
const route = useRoute()
const mobileOpen = shallowRef(false)

const navItems = computed(() => theme.value.nav ?? [])
const searchText = computed(() => {
  if (theme.value.search?.provider !== 'local')
    return 'Search'
  return theme.value.search.options?.translations?.button?.buttonText || 'Search'
})
const localeOptions = computed(() => Object.entries(site.value.locales).map(([key, locale]) => ({
  key,
  label: locale.label || key,
  lang: locale.lang,
  link: resolveLocaleLink(key, locale),
})))
const homeLink = computed(() => localeIndex.value === 'root' ? withBase('/') : withBase(`/${localeIndex.value}/`))

function resolveLocaleLink(target: string, locale: LocaleSpecificConfig<ThemeConfig>): string {
  if (typeof theme.value.i18nRouting === 'function')
    return withBase(theme.value.i18nRouting(data as VitePressData<ThemeConfig>, route, target))

  if (theme.value.i18nRouting === false || !route.path) {
    const configured = 'link' in locale && typeof locale.link === 'string' ? locale.link : undefined
    return withBase(configured || (target === 'root' ? '/' : `/${target}/`))
  }

  const currentPrefix = localeIndex.value === 'root' ? '' : `/${localeIndex.value}`
  const targetPrefix = target === 'root' ? '' : `/${target}`
  const localPath = route.path.startsWith(currentPrefix) ? route.path.slice(currentPrefix.length) : '/'
  return withBase(`${targetPrefix}${localPath || '/'}`)
}

function navLink(item: DefaultTheme.NavItemWithLink): string {
  const link = resolveNavLink(item.link, page.value)
  return isExternalLink(link) ? link : withBase(link)
}
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-[var(--ff-line)] bg-[color-mix(in_srgb,var(--ff-bg)_94%,transparent)] backdrop-blur-md">
    <nav class="relative mx-auto flex h-14 max-w-6xl items-center border-x border-[var(--ff-line)] px-3 sm:px-6" :aria-label="theme.navMenuLabel || 'Main navigation'">
      <UiCross class="-bottom-[6px] -left-[6px]" />
      <UiCross class="-bottom-[6px] -right-[6px]" />

      <a :href="homeLink" class="ff-focus flex min-w-0 items-center gap-2.5 font-mono text-sm font-medium">
        <span class="grid size-6 shrink-0 place-items-center border border-[var(--ff-fg)] text-[10px]" aria-hidden="true">PM</span>
        <span class="hidden max-w-48 truncate sm:inline">{{ theme.siteTitle === false ? '' : (theme.siteTitle || site.title) }}</span>
      </a>

      <div class="ml-auto flex h-full items-center">
        <ul class="hidden h-full items-center px-2 md:flex">
          <li v-for="(item, index) in navItems" :key="index" class="flex h-full items-center">
            <a
              v-if="'link' in item"
              :href="navLink(item)"
              class="ff-focus flex h-full items-center gap-1 whitespace-nowrap px-3 text-sm font-medium text-[var(--ff-muted)] transition-colors hover:text-[var(--ff-fg)]"
              :class="isActiveLink(route.path, resolveNavLink(item.link, page), item.activeMatch) && '!text-[var(--ff-fg)]'"
              :target="item.target || (isExternalLink(resolveNavLink(item.link, page)) ? '_blank' : undefined)"
              :rel="item.rel || (isExternalLink(resolveNavLink(item.link, page)) ? 'noreferrer' : undefined)"
            >
              {{ item.text }}
              <span v-if="isExternalLink(resolveNavLink(item.link, page))" class="text-[10px] text-[var(--ff-faint)]" aria-hidden="true">↗</span>
            </a>
            <details v-else-if="'items' in item" class="group relative flex h-full items-center">
              <summary class="ff-focus flex h-full cursor-pointer list-none items-center gap-1 px-3 text-sm font-medium text-[var(--ff-muted)] hover:text-[var(--ff-fg)]">
                {{ item.text }} <span aria-hidden="true">⌄</span>
              </summary>
              <div class="absolute right-0 top-full mt-2 min-w-48 border border-[var(--ff-line-strong)] bg-[var(--ff-bg)] p-2 shadow-xl">
                <template v-for="(child, childIndex) in item.items" :key="childIndex">
                  <a
                    v-if="'link' in child"
                    :href="navLink(child)"
                    class="block px-3 py-2 text-sm text-[var(--ff-muted)] hover:bg-[var(--ff-hover)] hover:text-[var(--ff-fg)]"
                  >
                    {{ child.text }}
                  </a>
                </template>
              </div>
            </details>
          </li>
        </ul>

        <div v-if="theme.search" class="hidden h-9 items-center border-l border-[var(--ff-line)] px-1 sm:flex">
          <button
            type="button"
            class="ff-icon-button !size-8 inline-flex"
            aria-keyshortcuts="/ control+k meta+k"
            :aria-label="searchText"
            @click="$emit('openSearch')"
          >
            <svg viewBox="0 0 20 20" class="size-4" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5.25" fill="none" stroke="currentColor" stroke-width="1.5" />
              <path d="m12.5 12.5 4 4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5" />
            </svg>
          </button>
        </div>

        <div v-if="localeOptions.length > 1" class="flex h-9 items-center border-l border-[var(--ff-line)] px-1">
          <AppLanguageMenu
            :current-key="localeIndex"
            :label="theme.langMenuLabel || 'Change language'"
            :locales="localeOptions"
          />
        </div>

        <div v-if="site.appearance" class="flex h-9 items-center border-l border-[var(--ff-line)] px-1">
          <button
            type="button"
            class="ff-icon-button !size-8 inline-flex"
            role="switch"
            :aria-checked="isDark"
            :aria-label="theme.darkModeSwitchLabel || 'Appearance'"
            :title="isDark ? theme.lightModeSwitchTitle : theme.darkModeSwitchTitle"
            @click="isDark = !isDark"
          >
            <span aria-hidden="true">{{ isDark ? '☼' : '◐' }}</span>
          </button>
        </div>

        <div v-if="theme.socialLinks?.length" class="hidden h-9 items-center border-l border-[var(--ff-line)] px-1 sm:flex">
          <a
            v-for="social in theme.socialLinks"
            :key="social.link"
            :href="social.link"
            class="ff-icon-button !size-8 inline-flex"
            target="_blank"
            :aria-label="social.ariaLabel || String(social.icon)"
            rel="me noopener"
          >
            <svg v-if="social.icon === 'github'" viewBox="0 0 16 16" class="size-4" aria-hidden="true"><path fill="currentColor" d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38v-1.49c-2.23.49-2.7-.95-2.7-.95-.36-.93-.89-1.18-.89-1.18-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.71 1.23 1.87.87 2.33.67.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.22 2.2.82A7.7 7.7 0 0 1 8 3.86c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 8 0Z" /></svg>
            <span v-else aria-hidden="true">↗</span>
          </a>
        </div>

        <div class="flex h-9 items-center border-l border-[var(--ff-line)] px-1 md:hidden">
          <button
            type="button"
            class="ff-icon-button !size-8 inline-flex"
            :aria-label="theme.mobileMenuLabel || theme.sidebarMenuLabel || 'Menu'"
            :aria-expanded="mobileOpen"
            @click="mobileOpen = !mobileOpen"
          >
            <span aria-hidden="true">{{ mobileOpen ? '×' : '☰' }}</span>
          </button>
        </div>
      </div>
    </nav>

    <div v-if="mobileOpen" class="border-t border-[var(--ff-line)] bg-[var(--ff-bg)] md:hidden">
      <nav class="mx-auto max-w-6xl border-x border-[var(--ff-line)] p-3" :aria-label="theme.mobileMenuLabel || 'Menu'">
        <button v-if="theme.search" type="button" class="mb-2 flex w-full items-center justify-between border border-[var(--ff-line)] px-3 py-2 font-mono text-xs uppercase" @click="$emit('openSearch'); mobileOpen = false">
          {{ searchText }} <span aria-hidden="true">⌕</span>
        </button>
        <template v-for="(item, index) in navItems" :key="index">
          <a v-if="'link' in item" :href="navLink(item)" class="block border-b border-[var(--ff-line)] px-3 py-3 font-mono text-xs uppercase tracking-[0.1em]" @click="mobileOpen = false">
            {{ item.text }}
          </a>
          <div v-else-if="'items' in item" class="border-b border-[var(--ff-line)] py-2">
            <p class="px-3 py-1 font-mono text-[10px] uppercase text-[var(--ff-faint)]">
              {{ item.text }}
            </p>
            <template v-for="(child, childIndex) in item.items" :key="childIndex">
              <a v-if="'link' in child" :href="navLink(child)" class="block px-3 py-2 text-sm" @click="mobileOpen = false">{{ child.text }}</a>
            </template>
          </div>
        </template>
      </nav>
    </div>
  </header>
</template>
