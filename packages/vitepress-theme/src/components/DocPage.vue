<script setup lang="ts">
import type { DefaultTheme } from 'vitepress'
import type { ThemeConfig } from '../types'
import { Content, useData, useRoute, withBase } from 'vitepress'
import { computed, onMounted, onUnmounted, shallowRef } from 'vue'
import { flattenSidebar, isActiveLink, isExternalLink, resolveSidebar } from '../utils/navigation'
import AppOutline from './AppOutline.vue'
import AppSidebar from './AppSidebar.vue'
import UiCross from './ui/UiCross.vue'

const { frontmatter, lang, page, theme } = useData<ThemeConfig>()
const route = useRoute()
const mobileSidebarOpen = shallowRef(false)

const sidebarItems = computed(() => resolveSidebar(theme.value.sidebar, route.path))
const hasSidebar = computed(() => frontmatter.value.sidebar !== false && sidebarItems.value.length > 0)
const hasOutline = computed(() => theme.value.aside !== false && theme.value.outline !== false && page.value.headers.length > 0)
const flatItems = computed(() => flattenSidebar(sidebarItems.value))
const currentIndex = computed(() => flatItems.value.findIndex(item => item.link && isActiveLink(route.path, item.link)))
const previous = computed(() => currentIndex.value > 0 ? flatItems.value[currentIndex.value - 1] : undefined)
const next = computed(() => currentIndex.value >= 0 ? flatItems.value[currentIndex.value + 1] : undefined)
const previousPage = computed(() => theme.value.docFooter?.prev === false ? undefined : previous.value)
const nextPage = computed(() => theme.value.docFooter?.next === false ? undefined : next.value)
const previousLabel = computed(() => typeof theme.value.docFooter?.prev === 'string' ? theme.value.docFooter.prev : 'Previous page')
const nextLabel = computed(() => typeof theme.value.docFooter?.next === 'string' ? theme.value.docFooter.next : 'Next page')
const editLink = computed(() => resolveEditLink(theme.value.editLink))
const lastUpdated = computed(() => {
  if (!page.value.lastUpdated || !theme.value.lastUpdated)
    return undefined

  const options = theme.value.lastUpdated.formatOptions
  const locale = options?.forceLocale ? undefined : lang.value
  const { forceLocale: _forceLocale, ...formatOptions } = options ?? {}
  return new Intl.DateTimeFormat(locale, Object.keys(formatOptions).length ? formatOptions : { dateStyle: 'medium' }).format(page.value.lastUpdated)
})

function resolveEditLink(config: DefaultTheme.EditLink | undefined): string | undefined {
  if (!config)
    return undefined
  if (typeof config.pattern === 'function')
    return config.pattern(page.value)
  return config.pattern
    .replace(/:path/g, page.value.filePath)
    .replace(/:line/g, String(frontmatter.value.__line__ || 1))
}

function pageLink(item: DefaultTheme.SidebarItem): string | undefined {
  if (!item.link)
    return undefined
  return isExternalLink(item.link) ? item.link : withBase(item.link)
}

function onContentClick(event: MouseEvent): void {
  const target = event.target
  if (!(target instanceof Element))
    return

  const button = target.closest<HTMLButtonElement>('button.copy')
  if (!button)
    return

  const code = button.parentElement?.querySelector('pre code')?.textContent
  if (!code)
    return

  void navigator.clipboard.writeText(code).then(() => {
    button.classList.add('copied')
    window.setTimeout(() => button.classList.remove('copied'), 1600)
  })
}

function onMobileSidebarToggle(event: Event): void {
  mobileSidebarOpen.value = (event.currentTarget as HTMLDetailsElement).open
}

onMounted(() => document.addEventListener('click', onContentClick))
onUnmounted(() => document.removeEventListener('click', onContentClick))
</script>

<template>
  <div>
    <details v-if="hasSidebar" :open="mobileSidebarOpen" class="border-b border-[var(--ff-line)] lg:hidden" @toggle="onMobileSidebarToggle">
      <summary class="flex cursor-pointer list-none items-center justify-between px-6 py-3 font-mono text-xs uppercase tracking-[0.1em]">
        {{ theme.sidebarMenuLabel || 'Menu' }}
        <span aria-hidden="true">{{ mobileSidebarOpen ? '−' : '+' }}</span>
      </summary>
      <div class="max-h-[60vh] overflow-y-auto border-t border-[var(--ff-line)] px-6 py-5">
        <AppSidebar :items="sidebarItems" @navigate="mobileSidebarOpen = false" />
      </div>
    </details>

    <div
      class="grid min-h-[70vh]"
      :class="[
        hasSidebar && hasOutline ? 'lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)_13rem]' : '',
        hasSidebar && !hasOutline ? 'lg:grid-cols-[15rem_minmax(0,1fr)]' : '',
        !hasSidebar && hasOutline ? 'xl:grid-cols-[minmax(0,1fr)_13rem]' : '',
      ]"
    >
      <aside v-if="hasSidebar" class="hidden border-r border-[var(--ff-line)] lg:block">
        <div class="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto px-6 py-10">
          <AppSidebar :items="sidebarItems" />
        </div>
      </aside>

      <article class="relative min-w-0 px-6 py-12 sm:px-10 lg:px-12 lg:py-16">
        <UiCross class="-left-[6px] -top-[6px] hidden lg:block" />
        <div class="mx-auto max-w-3xl">
          <Content class="vp-doc" />

          <footer class="mt-16 border-t border-[var(--ff-line)] pt-6">
            <div v-if="editLink || lastUpdated" class="flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--ff-muted)]">
              <a v-if="editLink" :href="editLink" target="_blank" rel="noopener" class="underline underline-offset-4 hover:text-[var(--ff-fg)]">
                {{ theme.editLink?.text || 'Edit this page' }}
              </a>
              <p v-if="lastUpdated">
                {{ theme.lastUpdated && theme.lastUpdated.text || 'Last updated' }}: {{ lastUpdated }}
              </p>
            </div>

            <nav v-if="previousPage || nextPage" class="mt-8 grid gap-px border border-[var(--ff-line)] bg-[var(--ff-line)] sm:grid-cols-2" aria-label="Page navigation">
              <a v-if="previousPage" :href="pageLink(previousPage)" class="group bg-[var(--ff-bg)] p-5 hover:bg-[var(--ff-hover)]">
                <span class="ff-label">← {{ previousLabel }}</span>
                <strong class="mt-2 block text-sm">{{ previousPage.docFooterText || previousPage.text }}</strong>
              </a>
              <span v-else class="hidden bg-[var(--ff-bg)] sm:block" />
              <a v-if="nextPage" :href="pageLink(nextPage)" class="group bg-[var(--ff-bg)] p-5 text-right hover:bg-[var(--ff-hover)]">
                <span class="ff-label">{{ nextLabel }} →</span>
                <strong class="mt-2 block text-sm">{{ nextPage.docFooterText || nextPage.text }}</strong>
              </a>
            </nav>
          </footer>
        </div>
      </article>

      <aside v-if="hasOutline" class="hidden border-l border-[var(--ff-line)] xl:block">
        <div class="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto px-5 py-10">
          <AppOutline />
        </div>
      </aside>
    </div>
  </div>
</template>
