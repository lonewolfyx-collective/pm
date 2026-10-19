<script setup lang="ts">
import type { ThemeConfig } from '../types'
import { useData } from 'vitepress'
import { computed } from 'vue'
import UiButton from './ui/UiButton.vue'

const { theme } = useData<ThemeConfig>()
const options = computed(() => theme.value.notFound ?? {})
</script>

<template>
  <section class="grid min-h-[70vh] place-items-center px-6 py-20 text-center">
    <div class="flex max-w-xl flex-col items-center gap-6">
      <span class="ff-label">Error / 404</span>
      <h1 class="display text-5xl font-semibold sm:text-7xl">
        {{ options.title || 'Page not found' }}
      </h1>
      <p v-if="options.quote" class="text-sm leading-7 text-[var(--ff-muted)]">
        {{ options.quote }}
      </p>
      <UiButton :href="options.link || '/'" variant="solid" :aria-label="options.linkLabel">
        {{ options.linkText || 'Take me home' }}
      </UiButton>
    </div>
  </section>
</template>
