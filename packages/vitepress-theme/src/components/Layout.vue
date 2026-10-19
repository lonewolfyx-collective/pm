<script setup lang="ts">
import type { ThemeConfig } from '../types'
import { useData } from 'vitepress'
import { computed, shallowRef } from 'vue'
import AppFooter from './AppFooter.vue'
import AppHeader from './AppHeader.vue'
import AppSearch from './AppSearch.vue'
import DocPage from './DocPage.vue'
import HomePage from './HomePage.vue'
import NotFoundPage from './NotFoundPage.vue'

const { frontmatter, page, theme } = useData<ThemeConfig>()
const searchOpen = shallowRef(false)

const isHome = computed(() => frontmatter.value.layout === 'home')
const showFooter = computed(() => frontmatter.value.footer !== false && Boolean(theme.value.footer))
</script>

<template>
  <div class="min-h-screen flex flex-col overflow-x-clip bg-[var(--ff-bg)] text-[var(--ff-fg)]">
    <a
      href="#main-content"
      class="fixed left-3 top-3 z-50 -translate-y-24 border border-[var(--ff-fg)] bg-[var(--ff-bg)] px-3 py-2 font-mono text-xs focus:translate-y-0"
    >
      {{ theme.skipToContentLabel || 'Skip to content' }}
    </a>

    <AppHeader @open-search="searchOpen = true" />

    <main id="main-content" class="mx-auto w-full max-w-6xl flex-1 border-x border-[var(--ff-line)]" tabindex="-1">
      <NotFoundPage v-if="page.isNotFound" />
      <HomePage v-else-if="isHome" />
      <DocPage v-else />
    </main>

    <AppFooter v-if="showFooter" />
    <AppSearch v-model:open="searchOpen" />
  </div>
</template>
