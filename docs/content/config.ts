import type { MarkdownLocaleOptions } from 'vitepress'
import { defineAdditionalConfig } from 'vitepress'
import { footer } from '../.vitepress/footer.ts'

export const markdown: MarkdownLocaleOptions = {
  container: {
    tipLabel: '提示',
    infoLabel: '信息',
    warningLabel: '警告',
    dangerLabel: '危险',
    detailsLabel: '详细信息',
    noteLabel: '注意',
    importantLabel: '重要',
    cautionLabel: '小心',
  },
  codeCopyButton: {
    tooltipText: '复制代码',
    copiedText: '已复制',
  },
}

export default defineAdditionalConfig({
  title: '一组更顺手的包管理 CLI',
  description: '面向依赖、pnpm catalog 与工作区项目的命令行工具',
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/guide/getting-started' },
      { text: '命令', link: '/commands/ni' },
      { text: 'GitHub', link: 'https://github.com/lonewolfyx-collective/pm' },
    ],
    search: {
      options: {
        translations: {
          button: {
            buttonText: '搜索',
            buttonAriaLabel: '搜索',
          },
          modal: {
            noResultsText: '没有找到相关结果',
            resetButtonTitle: '重置搜索',
            footer: {
              selectText: '选择',
              navigateText: '导航',
              closeText: '关闭',
            },
          },
        },
      },
    },
    sidebar: [
      {
        text: '开始使用',
        collapsed: false,
        items: [
          { text: '快速开始', link: '/guide/getting-started' },
          { text: '工作目录与工作区', link: '/guide/workspace' },
          { text: 'pnpm Catalog', link: '/guide/catalog' },
        ],
      },
      {
        text: '命令',
        collapsed: false,
        items: [
          { text: 'ni：安装依赖', link: '/commands/ni' },
          { text: 'remove：移除依赖', link: '/commands/remove' },
          { text: 'catalog：管理目录', link: '/commands/catalog' },
          { text: 'dev / build：运行脚本', link: '/commands/scripts' },
          { text: 'clearn：清理产物', link: '/commands/clearn' },
          { text: 'init：初始化项目', link: '/commands/init' },
        ],
      },
      {
        text: '参考',
        collapsed: false,
        items: [
          { text: 'CLI 速查', link: '/reference/cli' },
          { text: '常见问题', link: '/reference/troubleshooting' },
          { text: '参与文档维护', link: '/reference/documentation' },
        ],
      },
    ],
    editLink: {
      pattern: 'https://github.com/lonewolfyx-collective/pm/edit/main/docs/content/:path',
      text: '在 GitHub 上编辑此页',
    },
    lastUpdated: {
      text: '最后更新',
    },
    outline: {
      label: '本页内容',
      level: [2, 3],
    },
    docFooter: {
      prev: '上一页',
      next: '下一页',
    },
    footer,
    notFound: {
      title: '页面未找到',
      linkLabel: '前往首页',
      linkText: '带我回首页',
    },
    langMenuLabel: '多语言',
    returnToTopLabel: '返回顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '外观',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    skipToContentLabel: '跳转到内容',
  },
})
