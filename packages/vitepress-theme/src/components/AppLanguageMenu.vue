<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef, useTemplateRef } from 'vue'

interface LocaleOption {
  key: string
  label: string
  lang?: string
  link: string
}

defineProps<{
  currentKey: string
  label: string
  locales: LocaleOption[]
}>()

const open = shallowRef(false)
const root = useTemplateRef<HTMLElement>('root')
const trigger = useTemplateRef<HTMLButtonElement>('trigger')

function close(restoreFocus = false): void {
  open.value = false
  if (restoreFocus)
    trigger.value?.focus()
}

function onDocumentPointerdown(event: PointerEvent): void {
  if (event.target instanceof Node && !root.value?.contains(event.target))
    close()
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape')
    return

  event.stopPropagation()
  close(true)
}

onMounted(() => document.addEventListener('pointerdown', onDocumentPointerdown))
onUnmounted(() => document.removeEventListener('pointerdown', onDocumentPointerdown))
</script>

<template>
  <div ref="root" class="relative h-8" @keydown="onKeydown">
    <button
      ref="trigger"
      type="button"
      class="ff-focus flex h-8 items-center gap-1 px-3 text-sm text-[var(--ff-muted)] transition-colors hover:bg-[var(--ff-hover)] hover:text-[var(--ff-fg)]"
      :aria-label="label"
      aria-haspopup="menu"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="font-mono" aria-hidden="true">文</span>
      <span class="text-[10px] transition-transform" :class="open && 'rotate-180'" aria-hidden="true">⌄</span>
    </button>

    <div
      v-if="open"
      class="absolute right-0 top-full z-40 mt-2 min-w-40 border border-[var(--ff-line-strong)] bg-[var(--ff-bg)] p-2 shadow-xl"
      role="menu"
    >
      <a
        v-for="locale in locales"
        :key="locale.key"
        :href="locale.link"
        :lang="locale.lang"
        class="ff-focus flex items-center justify-between gap-6 px-3 py-2 text-sm text-[var(--ff-muted)] transition-colors hover:bg-[var(--ff-hover)] hover:text-[var(--ff-fg)]"
        :class="locale.key === currentKey && '!font-medium !text-[var(--ff-fg)]'"
        :aria-current="locale.key === currentKey ? 'page' : undefined"
        role="menuitem"
        @click="close()"
      >
        <span>{{ locale.label }}</span>
        <span v-if="locale.key === currentKey" aria-hidden="true">✓</span>
      </a>
    </div>
  </div>
</template>
