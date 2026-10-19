<script setup lang="ts">
import type { Header } from 'vitepress'
import type { ThemeConfig } from '../types'
import { useData } from 'vitepress'
import { computed } from 'vue'
import AppOutlineItem from './AppOutlineItem.vue'

const { page, theme } = useData<ThemeConfig>()

const label = computed(() => typeof theme.value.outline === 'object' && !Array.isArray(theme.value.outline) ? theme.value.outline.label || 'On this page' : 'On this page')
const headers = computed(() => filterHeaders(page.value.headers, theme.value.outline))

function filterHeaders(headers: Header[], outline: ThemeConfig['outline']): Header[] {
  const level = typeof outline === 'object' && !Array.isArray(outline) ? outline.level : outline
  const [min, max] = level === 'deep'
    ? [2, 6]
    : Array.isArray(level)
      ? level
      : [level || 2, level || 2]

  return headers.flatMap((header) => {
    const children = filterHeaders(header.children || [], outline)
    if (header.level >= min && header.level <= max)
      return [{ ...header, children }]
    return children
  })
}
</script>

<template>
  <nav v-if="headers.length" aria-labelledby="outline-title">
    <p id="outline-title" class="ff-label mb-4 text-[var(--ff-fg)]">
      {{ label }}
    </p>
    <AppOutlineItem :items="headers" />
  </nav>
</template>
