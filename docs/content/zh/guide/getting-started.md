# 快速开始

## 安装

使用 pnpm 全局安装 CLI：

```bash
pnpm add -g @lonewolfyx/pm
```

安装完成后，可以直接使用包提供的七个命令：

```bash
ni --help
catalog --help
remove --help
dev --help
build --help
clearn --help
init --help
```

使用 `--version` 可以查看当前 CLI 版本。

## 第一次使用

在已有项目中，不带包名执行 `ni` 会安装清单里的全部依赖：

```bash
cd my-project
ni
```

添加常见依赖：

```bash
# 生产依赖
ni vue

# 开发依赖
ni -D typescript vite

# 可选依赖
ni -O sharp

# peer 依赖
ni --peer vue
```

工具会检测项目使用的包管理器。例如在 pnpm 项目中，上述命令最终会调用 `pnpm install` 或 `pnpm add`；在 npm、Yarn 等受检测器支持的项目中则调用相应命令。

## 指定工作目录

全部命令都接受 `-c, --cwd <dir>`：

```bash
ni vite --cwd ./apps/web
remove lodash --cwd ./packages/utils
catalog move vite --cwd ./apps/web
clearn --cwd ./apps/web
```

相对路径以当前终端目录为基准。工作区发现会从该目录开始向上查找 `pnpm-workspace.yaml`。

::: warning dev 与 build 的目录行为
当前版本的 `dev` 和 `build` 从终端当前目录读取可选脚本。为了保证“被选择的脚本”和“脚本实际执行目录”一致，请先 `cd` 到目标项目，再运行命令，不要依赖 `--cwd` 切换项目。
:::

## 下一步

- 单仓库或 monorepo 的目录解析规则见[工作目录与工作区](./workspace)。
- 使用 pnpm 集中维护版本见[pnpm Catalog](./catalog)。
- 所有选项可在 [CLI 速查](/reference/cli) 中快速查询。
