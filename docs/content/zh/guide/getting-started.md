# 快速开始

## 安装

使用 pnpm 全局安装 CLI：

```bash
pnpm add -g @lonewolfyx/pm
```

安装完成后，可以直接使用以下命令：

```bash
ni --help
catalog --help
remove --help
run --help
dev --help
build --help
lint --help
fix --help
clearn --help
create --help
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

未检测到包管理器时默认使用 npm。使用 pnpm 时，`ni` 检测到被忽略的构建脚本会自动执行 `approve-builds --all`，详见[构建脚本审批](/commands/ni#pnpm-构建脚本审批)。

## 从模板创建项目

```bash
create
```

交互选择模板并输入目标目录后，命令会下载模板。需要填写描述、替换模板占位符或初始化 Git 时，使用 `init my-project --git`。两种方式都需要网络连接，且不会自动安装依赖；已有目标目录会被清空，仅保留 `.git`，详见 [`create`](/commands/create) 和 [`init`](/commands/init)。

## 运行项目脚本

执行 `run` 从 `package.json#scripts` 中选择脚本，或传入关键词进行模糊匹配：

```bash
run
run docs
```

不传关键词时始终显示选择器；传入关键词时，单个匹配直接执行，多个匹配供选择，没有匹配则报错。未配置脚本时警告并结束。`dev`、`build`、`lint` 和 `fix` 分别使用命令名作为固定关键词，详见[运行脚本](/commands/scripts)。

## 指定工作目录

全部命令都接受 `-c, --cwd <dir>`：

```bash
ni vite --cwd ./apps/web
remove lodash --cwd ./my-monorepo
catalog move vite --cwd ./apps/web
run docs --cwd ./apps/web
clearn --cwd ./apps/web
```

相对路径以当前终端目录为基准。工作区发现会从该目录开始向上查找 `pnpm-workspace.yaml`。

`run`、`dev`、`build`、`lint` 和 `fix` 从指定工作目录解析 `package.json`，并在该目录执行选中的脚本。

## 下一步

- 单仓库或 monorepo 的目录解析规则见[工作目录与工作区](./workspace)。
- 使用 pnpm 集中维护版本见[pnpm Catalog](./catalog)。
- 所有选项可在 [CLI 速查](/reference/cli) 中快速查询。
