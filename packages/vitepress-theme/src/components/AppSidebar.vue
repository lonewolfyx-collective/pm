<script setup lang="ts">
import type { DefaultTheme } from 'vitepress'
import type { ThemeConfig } from '../types'
import { useData } from 'vitepress'
import AppSidebarItem from './AppSidebarItem.vue'

defineProps<{
  items: DefaultTheme.SidebarItem[]
}>()

defineEmits<{
  navigate: []
}>()

const { theme } = useData<ThemeConfig>()
</script>

<template>
  <nav :aria-label="theme.sidebarMenuLabel || 'Documentation navigation'">
    <ul>
      <AppSidebarItem
        v-for="(item, index) in items"
        :key="item.link || `${item.text}-${index}`"
        :item="item"
        @navigate="$emit('navigate')"
      />
    </ul>
  </nav>
</template>
