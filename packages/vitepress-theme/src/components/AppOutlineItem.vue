<script setup lang="ts">
import type { Header } from 'vitepress'

defineOptions({ name: 'AppOutlineItem' })

defineProps<{
  items: Header[]
}>()
</script>

<template>
  <ul class="space-y-2">
    <li v-for="item in items" :key="item.link">
      <a :href="item.link" class="block text-xs leading-5 text-[var(--ff-muted)] transition-colors hover:text-[var(--ff-fg)]">
        {{ item.title }}
      </a>
      <AppOutlineItem v-if="item.children?.length" :items="item.children" class="mt-2 border-l border-[var(--ff-line)] pl-3" />
    </li>
  </ul>
</template>
