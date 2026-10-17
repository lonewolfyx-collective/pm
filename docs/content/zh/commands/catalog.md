# catalog：管理目录

`catalog` 管理 `pnpm-workspace.yaml` 中的默认与命名 catalog。所有子命令都要求能从工作目录向上找到该文件。

## 移动依赖

```text
catalog move <package...> [--to <catalog>] [--cwd <dir>]
```

```bash
# 按每个包的内置规则移动；无规则时交互选择
catalog move eslint tsdown vite

# 整批移动到同一个命名 catalog
catalog move vitest playwright --to test

# 移动到默认 catalog
catalog move typescript -t default
```

工具会重写所有扫描项目中的四类依赖字段，并更新与该包匹配且原本使用 catalog 引用的 workspace `overrides`。旧来源 catalog 中对应项会被移除；无关项和其他空 catalog 不会在这里清理。

目标名称必须以字母或数字开头，后续可包含字母、数字、点、下划线或连字符。每个包都必须至少在一个扫描到的 `package.json` 中声明。

## 重命名或合并

```text
catalog rename [--from <name>] --to <name> [--cwd <dir>]
```

```bash
catalog rename --from build --to tooling
catalog rename -f build -t tooling

# 交互选择来源
catalog rename --to tooling

# 合并进默认 catalog
catalog rename --from tooling --to default
```

来源必须是命名 catalog，不能是默认 catalog。目标已存在时执行合并：同名依赖版本相同则保留一份，版本不同则在保存前报错。成功后，所有依赖字段和 workspace `overrides` 中的来源引用都会改为目标引用。

## 删除命名 catalog

```text
catalog remove [--catalog <name>] [--cwd <dir>]
```

```bash
catalog remove
catalog remove --catalog build
```

默认 catalog 不能删除。选定命名 catalog 后，需要决定如何保留其中依赖：

| 选择 | 结果 |
| --- | --- |
| 移到默认 catalog | 复制版本到 `catalog`，并将引用改为 `catalog:` |
| 恢复版本字符串 | 将项目清单和 overrides 中的引用替换成 catalog 内的版本 |

如果默认 catalog 已包含同名依赖但版本不同，迁移会在保存前中止。

::: warning 会保存修改
当前版本的 `catalog remove` 会直接保存 `pnpm-workspace.yaml` 和项目清单，不是预览命令。完成后请运行 `pnpm install` 同步锁文件。
:::

## 清理无用项

```bash
catalog --unUsed
catalog -u
```

工具列出没有引用的 catalog 条目，以及完全没有引用的 catalog。确认后才会删除；拒绝或取消不会修改文件。没有无用内容时直接退出。Workspace `overrides` 本身不会被删除，但它的 catalog 引用会让对应条目被视为使用中。

## 保存与锁文件

`move`、`rename`、`remove` 和确认后的无用项清理会先更新相关 `package.json`，再写入 `pnpm-workspace.yaml`。这些操作不会运行安装：

```bash
pnpm install
```

建议先用 `git diff` 审阅版本统一、引用重写和 catalog 删除是否符合预期，再同步锁文件。
