# 工作目录与工作区

## 工作目录

默认工作目录是启动命令时的 `process.cwd()`。可以通过公共参数覆盖：

```text
-c, --cwd <dir>  指定工作目录
```

包管理器检测、子进程执行和大多数清单查找都会使用这个目录。建议传入项目目录，而不是具体的 `package.json` 文件。

## pnpm 工作区发现

工具从工作目录向父目录查找最近的 `pnpm-workspace.yaml`。找到后，读取 `packages` 中的 glob：

```yaml
packages:
  - apps/*
  - packages/*
  - '!packages/legacy'
```

发现过程会：

- 展开正向匹配并读取其中的 `package.json`；
- 应用以 `!` 开头的排除规则；
- 始终排除 `.git` 与 `node_modules`；
- 对路径排序、去重后再读取项目；
- 将通配符前的目录作为 `init --monorepo` 可选工作区，例如 `apps` 和 `packages`。

只有 `packages` 是非空数组时，当前目录才会被视为有效 monorepo。仅存在 `pnpm-workspace.yaml`、但没有有效 `packages`，仍可进行 catalog 操作，不过不会发现子项目。

## 扫描的依赖字段

Catalog 命令会检查以下四个字段：

1. `dependencies`
2. `devDependencies`
3. `optionalDependencies`
4. `peerDependencies`

同时还会检查 `pnpm-workspace.yaml` 中通过 `catalog:` 或 `catalog:<name>` 引用版本的 `overrides`。

`remove` 的候选目标只来自前三个依赖字段，因此不能单独移除只存在于 `peerDependencies` 的声明；但在判断 catalog 项是否仍被使用时，peer 依赖会被计入引用。

## 根项目与子项目

工作目录对应的根 `package.json` 会和工作区子项目一起参与扫描。执行 `remove` 时：

- 根项目通过包管理器的 workspace-root 参数处理；
- 其他项目通过包名过滤；
- 同一个依赖只出现在一个项目时自动选择；
- 出现在多个项目时先交互选择目标，全部选择完成后才开始修改。

::: warning 包名要求
从子项目移除依赖时，包管理器过滤依赖 `package.json#name`。请确保工作区包具有唯一且有效的名称。
:::
