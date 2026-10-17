import { defineConfig } from 'vitepress'
import { markdown as zhMarkdown } from '../content/config.ts'

export default defineConfig({
  title: 'A set of more convenient CLI for package management',
  cleanUrls: true,
  lastUpdated: true,
  srcDir: './content',
  rewrites: {
    'zh/:rest*': ':rest*',
  },
  markdown: {
    lineNumbers: true,
  },
  themeConfig: {
    search: {
      provider: 'local',
    },
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/lonewolfyx-collective/pm',
      },
    ],
  },
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      dir: 'ltr',
      markdown: zhMarkdown,
    },
    en: {
      label: 'English',
      lang: 'en-US',
      dir: 'ltr',
    },
  },
})
