<script setup lang="ts">
import type { ThemeConfig } from '../types'
import { useData } from 'vitepress'
import UiCross from './ui/UiCross.vue'

const { theme } = useData<ThemeConfig>()
</script>

<template>
  <!-- eslint-disable vue/no-v-html -->
  <footer class="border-t border-[var(--ff-line)] text-xs text-[var(--ff-muted)]">
    <div class="relative mx-auto max-w-6xl border-x border-[var(--ff-line)]">
      <UiCross class="-left-[6px] -top-[6px]" />
      <UiCross class="-right-[6px] -top-[6px]" />
      <div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-5">
        <!-- VitePress theme configuration is trusted application code. -->
        <p v-if="theme.footer?.message" class="ff-footer-message" v-html="theme.footer.message" />
        <div class="flex items-center gap-4">
          <a
            v-for="social in theme.socialLinks"
            :key="social.link"
            :href="social.link"
            class="inline-flex items-center gap-1.5 hover:text-[var(--ff-fg)]"
            target="_blank"
            rel="noopener"
          >
            <span aria-hidden="true">↗</span>{{ social.ariaLabel || String(social.icon) }}
          </a>
        </div>
      </div>
      <p v-if="theme.footer?.copyright" class="border-t border-[var(--ff-line)] px-6 py-5" v-html="theme.footer.copyright" />
    </div>
  </footer>
</template>
