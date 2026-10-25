import { defineAdditionalConfig } from 'vitepress'
import { footer } from '../../.vitepress/footer.ts'

export default defineAdditionalConfig({
  title: 'package management CLI',
  description: 'CLI tools for dependencies, pnpm catalogs, and workspace projects',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/en/' },
      { text: 'Guide', link: '/en/guide/getting-started' },
      { text: 'Commands', link: '/en/commands/ni' },
      { text: 'GitHub', link: 'https://github.com/lonewolfyx-collective/pm' },
    ],
    sidebar: [
      {
        text: 'Getting Started',
        collapsed: false,
        items: [
          { text: 'Quick Start', link: '/en/guide/getting-started' },
          { text: 'Working Directory and Workspaces', link: '/en/guide/workspace' },
          { text: 'pnpm Catalogs', link: '/en/guide/catalog' },
        ],
      },
      {
        text: 'Commands',
        collapsed: false,
        items: [
          { text: 'ni: Install Dependencies', link: '/en/commands/ni' },
          { text: 'remove: Remove Dependencies', link: '/en/commands/remove' },
          { text: 'catalog: Manage Catalogs', link: '/en/commands/catalog' },
          { text: 'run / dev / build / lint / fix: Run Scripts', link: '/en/commands/scripts' },
          { text: 'clearn: Clean Artifacts', link: '/en/commands/clearn' },
          { text: 'create: Create from a Template', link: '/en/commands/create' },
          { text: 'init: Initialize Projects', link: '/en/commands/init' },
        ],
      },
      {
        text: 'Reference',
        collapsed: false,
        items: [
          { text: 'CLI Cheat Sheet', link: '/en/reference/cli' },
          { text: 'Troubleshooting', link: '/en/reference/troubleshooting' },
          { text: 'Documentation Guide', link: '/en/reference/documentation' },
        ],
      },
    ],
    editLink: {
      pattern: 'https://github.com/lonewolfyx-collective/pm/edit/main/docs/content/:path',
      text: 'Edit this page on GitHub',
    },
    lastUpdated: {
      text: 'Last updated',
    },
    outline: {
      label: 'On this page',
      level: [2, 3],
    },
    docFooter: {
      prev: 'Previous page',
      next: 'Next page',
    },
    footer,
    notFound: {
      title: 'Page not found',
      linkLabel: 'Go to home',
      linkText: 'Take me home',
    },
    langMenuLabel: 'Change language',
    returnToTopLabel: 'Return to top',
    sidebarMenuLabel: 'Menu',
    darkModeSwitchLabel: 'Appearance',
    lightModeSwitchTitle: 'Switch to light theme',
    darkModeSwitchTitle: 'Switch to dark theme',
    skipToContentLabel: 'Skip to content',
  },
})
