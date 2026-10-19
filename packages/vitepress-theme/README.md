# @lonewolfyx/vitepress-theme

A fully custom VitePress theme written in Vue and inspired by the interface of [Furifont](https://furifont.antfu.me/). It provides its own layout, home page, documentation shell, navigation, sidebar, outline, local search, locale switcher, appearance switcher, and footer.

This is a private workspace package. It exports its Vue and TypeScript source directly and is compiled together with the repository's VitePress documentation site. The theme does not extend VitePress's default theme.

## Use

```ts
// docs/.vitepress/config.ts
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitepress'

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
})
```

```ts
// docs/.vitepress/theme/index.ts
export { default } from '@lonewolfyx/vitepress-theme'
```

Existing VitePress `themeConfig` values for navigation, sidebar, local search, social links, edit links, last updated metadata, page navigation, outline, locales, 404 content, and footer are supported.
