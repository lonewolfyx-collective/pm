# pnpm Catalog

[pnpm catalog](https://pnpm.io/catalogs) 将共享版本放在 `pnpm-workspace.yaml`，项目清单只保留引用：

```yaml
packages:
  - packages/*

catalog:
  typescript: ^6.0.0

catalogs:
  build:
    tsdown: ^0.23.0
    vite: ^5.4.0
```

```json
{
  "devDependencies": {
    "typescript": "catalog:",
    "tsdown": "catalog:build",
    "vite": "catalog:build"
  }
}
```

## 默认 catalog 与命名 catalog

- `catalog` 是默认 catalog，引用写作 `catalog:`；工具内部也接受 `catalog:default`。
- `catalogs.<name>` 是命名 catalog，引用写作 `catalog:<name>`。
- Catalog 的值必须是版本字符串。

## 内置分类

`ni --catalog` 和 `catalog move` 共用分类规则。当前会自动匹配的规则如下：

| 目标 | 自动匹配的包 |
| --- | --- |
| `lint` | `eslint`、`@eslint/*`、`@antfu/eslint-config`、`oxlint`、`oxfmt` |
| `build` | `tsdown`、`vite` |

第一个匹配规则生效。包名可以携带版本，npm alias 也会在去除 alias 前缀后参与匹配。Git URL、文件路径等非 registry 来源不会自动分类。

交互列表还提供 `test`、`script`、`frontend`、`backend`、`types`、`inlined`、`prod`、`dev` 和 `config`。这些名称只是可选目标，不会自动识别包。

## 推荐工作流

新增依赖时直接分配：

```bash
ni --catalog -D eslint tsdown vite vitest
```

整理已有依赖：

```bash
catalog move eslint tsdown vite
```

修改完成后同步锁文件：

```bash
pnpm install
```

::: info 为什么需要手动安装
`catalog move`、`catalog rename`、`catalog remove` 和 `catalog -u` 直接编辑工作区 YAML 与项目清单，不会自动执行安装。这样可以先审阅变更，再统一更新 `pnpm-lock.yaml`。
:::

## 版本选择规则

移动依赖时，目标版本按以下顺序确定：

1. 目标 catalog 已有的版本；
2. 当前项目的声明；如果声明是 catalog 引用，则解析对应版本；
3. 第一个声明该依赖的工作区项目。

所有匹配项目随后都会改用同一个目标引用。因此，如果各项目原先使用不同版本，移动操作可能统一它们的实际版本。执行前请审阅 `package.json` 与 `pnpm-workspace.yaml`。
