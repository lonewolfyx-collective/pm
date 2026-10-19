<script setup lang="ts">
import type { HomeFrontmatter, ThemeConfig } from '../types'
import { Content, useData, withBase } from 'vitepress'
import { computed } from 'vue'
import UiButton from './ui/UiButton.vue'
import UiSection from './ui/UiSection.vue'

const { frontmatter, lang } = useData<ThemeConfig>()
const home = computed(() => frontmatter.value as HomeFrontmatter)
const featureTitle = computed(() => lang.value.startsWith('zh') ? '功能概览' : 'What it does')
const contentTitle = computed(() => lang.value.startsWith('zh') ? '进一步了解' : 'Explore')

function imageAttributes(image: NonNullable<HomeFrontmatter['hero']>['image']): Record<string, unknown> {
  if (!image)
    return {}
  const { src: _src, alt: _alt, ...attributes } = image
  return attributes
}
</script>

<template>
  <div>
    <section class="grid lg:grid-cols-2">
      <div class="flex flex-col gap-8 px-6 py-16 lg:border-r lg:border-[var(--ff-line)] lg:px-10 lg:py-24">
        <span v-if="home.hero?.name" class="ff-label">{{ home.hero.name }}</span>
        <h1 class="display hero-title font-semibold">
          {{ home.hero?.text }}
        </h1>
        <p class="max-w-[48ch] text-[15px] leading-[1.625] whitespace-pre-line text-[var(--ff-muted)]">
          {{ home.hero?.tagline }}
        </p>
        <div v-if="home.hero?.actions?.length" class="flex flex-wrap gap-3">
          <UiButton
            v-for="action in home.hero.actions"
            :key="action.link"
            :href="action.link"
            :variant="action.theme === 'brand' ? 'solid' : 'outline'"
          >
            {{ action.text }}
          </UiButton>
        </div>
      </div>

      <div class="ff-grid relative isolate flex min-h-80 items-center justify-center overflow-hidden border-t border-[var(--ff-line)] p-8 lg:border-t-0">
        <div class="absolute inset-6 border border-[var(--ff-line)]" aria-hidden="true" />
        <img
          v-if="home.hero?.image"
          :src="withBase(home.hero.image.src)"
          :alt="home.hero.image.alt || ''"
          v-bind="imageAttributes(home.hero.image)"
          class="relative z-1 max-h-[25rem] w-full object-contain"
        >
        <div v-else class="relative z-1 grid aspect-square w-52 place-items-center border border-[var(--ff-line-strong)] bg-[var(--ff-bg)] font-mono text-5xl">
          Aa
        </div>
        <span class="ff-label absolute bottom-4 left-4 z-2 border border-[var(--ff-line)] bg-[var(--ff-bg)] px-2 py-1">VitePress / Vue</span>
      </div>
    </section>

    <UiSection v-if="home.features?.length" index="01" :title="featureTitle">
      <ol class="-mb-px -mr-px grid sm:grid-cols-2 lg:grid-cols-4">
        <li
          v-for="(feature, index) in home.features"
          :key="feature.title"
          class="flex min-h-48 flex-col gap-3 border-b border-r border-[var(--ff-line)] p-8"
        >
          <span class="font-mono text-xs text-[var(--ff-muted)]">{{ String(index + 1).padStart(2, '0') }}</span>
          <h3 class="text-base font-semibold tracking-tight">
            {{ feature.title }}
          </h3>
          <p class="text-sm leading-[1.625] text-[var(--ff-muted)]">
            {{ feature.details }}
          </p>
          <a v-if="feature.link" :href="withBase(feature.link)" class="mt-auto font-mono text-xs underline underline-offset-4">
            {{ feature.linkText || 'Read more' }}
          </a>
        </li>
      </ol>
    </UiSection>

    <UiSection index="02" :title="contentTitle">
      <Content class="ff-home-content vp-doc w-full pb-12 lg:pb-14" />
    </UiSection>
  </div>
</template>
