<script setup lang="ts">
import type { DefaultTheme } from 'vitepress'
import { useRoute, withBase } from 'vitepress'
import { computed, shallowRef, watchEffect } from 'vue'
import { isActiveLink, isExternalLink } from '../utils/navigation'

defineOptions({ name: 'AppSidebarItem' })

const props = defineProps<{
  depth?: number
  item: DefaultTheme.SidebarItem
}>()

defineEmits<{
  navigate: []
}>()

const route = useRoute()
const collapsed = shallowRef(Boolean(props.item.collapsed))
const hasChildren = computed(() => Boolean(props.item.items?.length))
const isCollapsible = computed(() => props.item.collapsed !== undefined)
const active = computed(() => props.item.link ? isActiveLink(route.path, props.item.link) : false)
const href = computed(() => {
  if (!props.item.link)
    return undefined
  return isExternalLink(props.item.link) ? props.item.link : withBase(props.item.link)
})

watchEffect(() => {
  if (hasActiveChild(props.item, route.path))
    collapsed.value = false
})

function hasActiveChild(item: DefaultTheme.SidebarItem, currentPath: string): boolean {
  if (item.link && isActiveLink(currentPath, item.link))
    return true
  return item.items?.some(child => hasActiveChild(child, currentPath)) ?? false
}
</script>

<template>
  <li :class="depth ? 'mt-1' : 'mt-4 border-t border-[var(--ff-line)] pt-4 first:mt-0 first:border-t-0 first:pt-0'">
    <div class="flex items-center gap-1">
      <a
        v-if="item.link"
        :href="href"
        class="ff-focus relative min-w-0 flex-1 py-1.5 text-sm text-[var(--ff-muted)] transition-colors hover:text-[var(--ff-fg)]"
        :class="active && '!font-medium !text-[var(--ff-fg)]'"
        :target="isExternalLink(item.link) ? '_blank' : item.target"
        :rel="isExternalLink(item.link) ? 'noopener' : item.rel"
        :aria-current="active ? 'page' : undefined"
        @click="$emit('navigate')"
      >
        <span v-if="active" class="absolute -left-4 font-mono" aria-hidden="true">→</span>
        {{ item.text }}
      </a>
      <p v-else class="min-w-0 flex-1 text-xs font-semibold tracking-wide" :class="depth ? 'text-[var(--ff-muted)]' : 'text-[var(--ff-fg)]'">
        {{ item.text }}
      </p>
      <button
        v-if="hasChildren && isCollapsible"
        type="button"
        class="ff-focus grid size-7 place-items-center text-xs text-[var(--ff-muted)]"
        :aria-label="item.text"
        :aria-expanded="!collapsed"
        @click="collapsed = !collapsed"
      >
        <span class="transition-transform" :class="!collapsed && 'rotate-90'" aria-hidden="true">›</span>
      </button>
    </div>

    <ul v-if="hasChildren && !collapsed" class="mt-2">
      <AppSidebarItem
        v-for="(child, index) in item.items"
        :key="child.link || `${child.text}-${index}`"
        :item="child"
        :depth="(depth || 0) + 1"
        @navigate="$emit('navigate')"
      />
    </ul>
  </li>
</template>
