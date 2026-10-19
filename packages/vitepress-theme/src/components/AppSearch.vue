<script setup lang="ts">
import type { SearchResult } from 'minisearch'
import type { ThemeConfig } from '../types'
import localSearchIndex from '@localSearchIndex'
import MiniSearch from 'minisearch'
import { ClientOnly, useData, useRouter, withBase } from 'vitepress'
import { computed, nextTick, onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue'

interface SearchDocument {
  id: string
  text?: string
  title: string
  titles?: string[]
}

const open = defineModel<boolean>('open', { default: false })
const { lang, localeIndex, theme } = useData<ThemeConfig>()
const router = useRouter()
const dialog = useTemplateRef<HTMLElement>('dialog')
const input = useTemplateRef<HTMLInputElement>('input')
const query = shallowRef('')
const loading = shallowRef(false)
const index = shallowRef<MiniSearch<SearchDocument> | null>(null)
const results = shallowRef<SearchResult[]>([])
const selected = shallowRef(0)
let previousOverflow = ''

const options = computed(() => theme.value.search?.provider === 'local' ? theme.value.search.options : undefined)
const translations = computed(() => options.value?.translations)
const buttonText = computed(() => translations.value?.button?.buttonText || 'Search')
const noResultsText = computed(() => translations.value?.modal?.noResultsText || 'No results found')
const emptyText = computed(() => lang.value.startsWith('zh') ? '输入关键词搜索文档' : 'Type to search the documentation')
const loadingText = computed(() => lang.value.startsWith('zh') ? '正在加载…' : 'Loading…')
const navigateText = computed(() => translations.value?.modal?.footer?.navigateText || 'Navigate')
const selectText = computed(() => translations.value?.modal?.footer?.selectText || 'Select')
const closeText = computed(() => translations.value?.modal?.footer?.closeText || 'Close')

watch(open, async (value) => {
  if (!value) {
    document.body.style.overflow = previousOverflow
    return
  }

  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  await loadIndex()
  await nextTick()
  input.value?.focus()
  input.value?.select()
})

watch([query, index], () => {
  if (!query.value.trim() || !index.value) {
    results.value = []
    return
  }

  results.value = index.value.search(query.value, {
    boost: { title: 4, text: 2, titles: 1 },
    fuzzy: 0.2,
    prefix: true,
    ...options.value?.miniSearch?.searchOptions,
  }).slice(0, 16)
  selected.value = 0
})

async function loadIndex(): Promise<void> {
  if (index.value)
    return

  loading.value = true
  try {
    const module = await localSearchIndex[localeIndex.value]?.()
    if (!module)
      return

    index.value = MiniSearch.loadJSON<SearchDocument>(module.default, {
      fields: ['title', 'titles', 'text'],
      storeFields: ['title', 'titles'],
      ...options.value?.miniSearch?.options,
    })
  }
  finally {
    loading.value = false
  }
}

function close(): void {
  open.value = false
}

function resultTitle(result: SearchResult): string {
  const title = typeof result.title === 'string' ? result.title : String(result.id)
  const titles = Array.isArray(result.titles) ? result.titles.filter(value => typeof value === 'string') : []
  return [...titles, title].filter(Boolean).join(' / ')
}

function resultHref(result: SearchResult): string {
  return withBase(String(result.id))
}

function choose(result: SearchResult): void {
  close()
  void router.go(resultHref(result))
}

function onDialogKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    close()
    return
  }
  if (!results.value.length)
    return trapFocus(event)

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    selected.value = (selected.value + 1) % results.value.length
  }
  else if (event.key === 'ArrowUp') {
    event.preventDefault()
    selected.value = (selected.value - 1 + results.value.length) % results.value.length
  }
  else if (event.key === 'Enter') {
    event.preventDefault()
    const result = results.value[selected.value]
    if (result)
      choose(result)
  }
  else {
    trapFocus(event)
  }
}

function trapFocus(event: KeyboardEvent): void {
  if (event.key !== 'Tab' || !dialog.value)
    return

  const focusable = [...dialog.value.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')]
  const first = focusable[0]
  const last = focusable.at(-1)
  if (!first || !last)
    return

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  }
  else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function onGlobalKeydown(event: KeyboardEvent): void {
  const target = event.target as HTMLElement
  if (target?.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(target?.tagName))
    return

  if (event.key === '/' || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k')) {
    event.preventDefault()
    open.value = true
  }
}

onMounted(() => window.addEventListener('keydown', onGlobalKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
  document.body.style.overflow = previousOverflow
})
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-start justify-center bg-black/45 px-4 pt-[10vh] backdrop-blur-sm"
        role="presentation"
        @mousedown.self="close"
      >
        <section
          ref="dialog"
          role="dialog"
          aria-modal="true"
          :aria-label="buttonText"
          class="w-full max-w-2xl border border-[var(--ff-line-strong)] bg-[var(--ff-bg)] shadow-2xl"
          @keydown="onDialogKeydown"
        >
          <div class="flex h-14 items-center gap-3 border-b border-[var(--ff-line)] px-4">
            <span class="font-mono text-lg" aria-hidden="true">⌕</span>
            <input
              ref="input"
              v-model="query"
              type="search"
              class="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[var(--ff-faint)]"
              :placeholder="buttonText"
              :aria-label="buttonText"
            >
            <button type="button" class="ff-focus border border-[var(--ff-line)] px-2 py-1 font-mono text-[10px] text-[var(--ff-muted)]" :aria-label="closeText" @click="close">
              ESC
            </button>
          </div>

          <div class="max-h-[60vh] overflow-y-auto p-2">
            <p v-if="loading" class="px-4 py-10 text-center font-mono text-xs uppercase text-[var(--ff-muted)]">
              {{ loadingText }}
            </p>
            <p v-else-if="query && !results.length" class="px-4 py-10 text-center text-sm text-[var(--ff-muted)]">
              {{ noResultsText }}
            </p>
            <p v-else-if="!query" class="px-4 py-10 text-center font-mono text-xs uppercase tracking-[0.1em] text-[var(--ff-faint)]">
              {{ emptyText }}
            </p>
            <ol v-else>
              <li v-for="(result, resultIndex) in results" :key="String(result.id)">
                <a
                  :href="resultHref(result)"
                  class="block border border-transparent px-4 py-3 text-sm transition-colors"
                  :class="resultIndex === selected ? 'border-[var(--ff-line-strong)] bg-[var(--ff-hover)]' : 'hover:bg-[var(--ff-hover)]'"
                  @mouseenter="selected = resultIndex"
                  @click.prevent="choose(result)"
                >
                  <span class="font-medium">{{ resultTitle(result) }}</span>
                  <span class="mt-1 block truncate font-mono text-[10px] text-[var(--ff-faint)]">{{ result.id }}</span>
                </a>
              </li>
            </ol>
          </div>

          <footer class="flex items-center justify-between border-t border-[var(--ff-line)] px-4 py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ff-faint)]">
            <span>↑↓ {{ navigateText }}</span>
            <span>↵ {{ selectText }}</span>
          </footer>
        </section>
      </div>
    </Teleport>
  </ClientOnly>
</template>
