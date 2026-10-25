# clearn：清理产物

`clearn` 递归查找并立即删除常见依赖目录、构建产物和缓存。

## 用法

```bash
clearn
clearn --cwd ./apps/web
clearn --lockfile
```

::: danger 删除没有确认步骤
发现的目标会被立即删除。请先确认 `--cwd` 指向正确项目，并提交或备份仍需保留的产物。
:::

## 默认删除目标

```text
node_modules       jspm_packages      web_modules
dist               build              out
.nuxt              .next              .output
.svelte-kit        .docusaurus        .vuepress/dist
.cache             .parcel-cache      .temp
.turbo             .build             .serverless
.fusebox           .dynamodb          .firebase
.tern-port         Carthage
```

搜索时包含点目录，但会跳过 `.git` 和符号链接。进入已匹配的目标后不会继续遍历其子级，从而避免重复删除同一棵目录树。

## 删除锁文件

加上 `--lockfile` 后，会根据检测到的包管理器同时寻找其已知锁文件：

```bash
clearn --lockfile
```

`pnpm-workspace.yaml` 属于工作区配置，不会作为锁文件删除。未检测到包管理器时，公共配置默认使用 npm，因此会按 npm 锁文件规则清理。

## 清空工作目录

```bash
clearn --all --cwd ./temporary-project
```

`--all` 直接清空工作目录，保留顶层名为 `.git` 的条目。它优先于默认清理和 `--lockfile`，不使用目标列表、锁文件筛选或符号链接跳过规则。

::: danger 会删除源码和配置
此模式不会询问确认，源码、`package.json`、锁文件和 `pnpm-workspace.yaml` 都会被删除。仅应在确认可以清空的目录中运行。
:::

## 输出

默认清理完成后会打印删除数量和目标列表。没有匹配项时输出 `No targets found.`，不会报错。`--all` 只显示清理进度和完成提示，不列出删除目标。
