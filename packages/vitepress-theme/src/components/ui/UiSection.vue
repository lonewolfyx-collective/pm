<script setup lang="ts">
import UiCross from './UiCross.vue'

defineProps<{
  index?: string
  title?: string
}>()
</script>

<template>
  <section class="relative border-t border-[var(--ff-line)]">
    <UiCross class="-left-[6px] -top-[6px]" />
    <UiCross class="-right-[6px] -top-[6px]" />
    <header
      v-if="title"
      class="flex items-baseline gap-3 border-b border-[var(--ff-line)] px-6 py-3"
    >
      <span v-if="index" class="ff-label">{{ index }}</span>
      <h2 class="ff-label text-[var(--ff-fg)]">
        {{ title }}
      </h2>
    </header>
    <slot />
  </section>
</template>
