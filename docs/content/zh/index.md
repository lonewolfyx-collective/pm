---
layout: home

hero:
  name: '@lonewolfyx/pm'
  text: 一组更顺手的包管理 CLI
  tagline: 安装与移除依赖、维护 pnpm catalog、运行项目脚本，以及初始化和清理工作区。
  image:
    src: /hero-terminal.svg
    alt: pm 命令行工作流示意图
    width: 520
    height: 400
    fetchpriority: high
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: CLI 速查
      link: /reference/cli

features:
  - title: 包管理器感知
    details: 自动检测当前项目使用的包管理器，并将 ni、remove、run、dev、build、lint 和 fix 转换成对应命令。
  - title: pnpm Catalog 工作流
    details: 支持依赖分类、迁移、重命名、合并、删除与无用项清理，并同步 package.json 引用。
  - title: Monorepo 友好
    details: 根据 pnpm-workspace.yaml 发现工作区项目，支持跨包移除依赖和创建包清单。
  - title: 交互式操作
    details: 在脚本、项目或 catalog 目标不唯一时给出清晰的终端选择，而不是要求记住复杂参数。
---

## 命令一览

| 命令 | 用途 |
| --- | --- |
| [`ni`](/commands/ni) | 安装项目依赖，或添加生产、开发、可选、peer 依赖 |
| [`remove`](/commands/remove) | 从一个或多个项目移除依赖，并清理失去引用的 catalog 项 |
| [`catalog`](/commands/catalog) | 迁移、重命名、删除或清理 pnpm catalog |
| [`run`](/commands/scripts) | 交互选择项目脚本，支持传入关键词模糊匹配 |
| [`dev`](/commands/scripts) | 模糊查找并运行名称匹配 `dev` 的脚本 |
| [`build`](/commands/scripts) | 模糊查找并运行名称匹配 `build` 的脚本 |
| [`lint`](/commands/scripts) | 模糊查找并运行名称匹配 `lint` 的脚本 |
| [`fix`](/commands/scripts) | 模糊查找并运行名称匹配 `fix` 的脚本 |
| [`clearn`](/commands/clearn) | 递归删除依赖目录、构建产物和缓存 |
| [`create`](/commands/create) | 交互选择模板和目录，下载模板文件 |
| [`init`](/commands/init) | 初始化包配置、项目模板、工作区包或 GitHub 工作流 |
