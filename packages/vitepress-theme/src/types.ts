import type { DefaultTheme } from 'vitepress'

export type ThemeConfig = DefaultTheme.Config

export interface HeroAction {
  link: string
  text: string
  theme?: 'brand' | 'alt'
}

export interface HeroImage {
  alt?: string
  src: string
  [key: string]: unknown
}

export interface HomeFeature {
  details: string
  link?: string
  linkText?: string
  title: string
}

export interface HomeFrontmatter {
  features?: HomeFeature[]
  hero?: {
    actions?: HeroAction[]
    image?: HeroImage
    name?: string
    tagline?: string
    text?: string
  }
}
