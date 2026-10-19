import type { Theme } from 'vitepress'
import Layout from './components/Layout.vue'
import './style.css'

export type { ThemeConfig } from './types'

export default {
  Layout,
} satisfies Theme
