<script setup lang="ts">
import { withBase } from 'vitepress'
import { computed } from 'vue'
import { isExternalLink } from '../../utils/navigation'

const props = withDefaults(defineProps<{
  href: string
  variant?: 'solid' | 'outline'
}>(), {
  variant: 'outline',
})

const classes = computed(() => [
  'inline-flex min-h-10 items-center justify-center border px-4 font-mono text-xs uppercase tracking-[0.1em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ff-fg)]',
  props.variant === 'solid'
    ? 'border-[var(--ff-fg)] bg-[var(--ff-fg)] text-[var(--ff-bg)] hover:bg-transparent hover:text-[var(--ff-fg)]'
    : 'border-[var(--ff-line-strong)] bg-[var(--ff-bg)] text-[var(--ff-fg)] hover:border-[var(--ff-fg)] hover:bg-[var(--ff-fg)] hover:text-[var(--ff-bg)]',
])

const resolvedHref = computed(() => isExternalLink(props.href) ? props.href : withBase(props.href))
</script>

<template>
  <a
    :href="resolvedHref"
    :class="classes"
    :target="isExternalLink(href) ? '_blank' : undefined"
    :rel="isExternalLink(href) ? 'noopener' : undefined"
  >
    <slot />
  </a>
</template>
