# CLI 速查

## 公共选项

| 选项 | 适用命令 | 说明 |
| --- | --- | --- |
| `-c`, `--cwd <dir>` | 全部命令 | 指定工作目录，默认是当前终端目录 |
| `--help` | 全部命令 | 显示帮助 |
| `--version` | 全部命令 | 显示 CLI 版本 |

## 命令与示例

| 目标 | 命令 |
| --- | --- |
| 安装项目全部依赖 | `ni` |
| 添加生产依赖 | `ni vue axios` |
| 添加开发依赖 | `ni -D typescript vite` |
| 添加可选依赖 | `ni -O sharp` |
| 添加 peer 依赖 | `ni --peer vue` |
| 交互分配 catalog | `ni --catalog -D eslint vite vitest` |
| 整批分配 catalog | `ni --catalog-name test -D vitest` |
| 移除依赖 | `remove vite` |
| 按规则移动到 catalog | `catalog move eslint vite` |
| 指定移动目标 | `catalog move vite --to build` |
| 重命名或合并 catalog | `catalog rename --from build --to tooling` |
| 删除 catalog | `catalog remove --catalog tooling` |
| 清理无用 catalog 项 | `catalog -u` |
| 从全部脚本中选择 | `run` |
| 按关键词模糊匹配脚本 | `run docs` |
| 在指定项目中匹配脚本 | `run docs --cwd ./apps/web` |
| 选择开发脚本 | `dev` |
| 选择构建脚本 | `build` |
| 选择检查脚本 | `lint` |
| 选择修复脚本 | `fix` |
| 清理产物和缓存 | `clearn` |
| 连锁文件一起清理 | `clearn --lockfile` |
| 初始化包配置 | `init` |
| 从模板创建项目 | `init my-project --git` |
| 创建工作区包 | `init my-package --monorepo` |
| 添加 GitHub 工作流 | `init --github` |

## Catalog 子命令选项

| 命令 | 选项 | 说明 |
| --- | --- | --- |
| `catalog move` | `-t`, `--to <name>` | 所有传入依赖的目标 catalog |
| `catalog rename` | `-f`, `--from <name>` | 来源命名 catalog；省略时交互选择 |
| `catalog rename` | `-t`, `--to <name>` | 目标 catalog，命令行中必填 |
| `catalog remove` | `--catalog <name>` | 待删除的命名 catalog；省略时交互选择 |
| `catalog` | `-u`, `--unUsed` | 列出并确认删除无用项 |

::: tip 查看最终参数定义
安装版本升级后，可随时运行 `<command> --help` 或 `catalog <subcommand> --help` 查看该版本实际接受的参数。
:::
