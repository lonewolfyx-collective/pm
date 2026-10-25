# 常见问题

## 找不到 pnpm-workspace.yaml

`catalog` 命令必须从工作目录向上找到 `pnpm-workspace.yaml`。请确认：

```bash
pwd
ls pnpm-workspace.yaml
```

如果文件位于其他目录，切换目录或传入：

```bash
catalog -u --cwd /path/to/workspace
```

## 找不到要移动或移除的依赖

- `catalog move` 扫描四类依赖字段；
- `remove` 只将生产、开发和可选依赖作为卸载候选；
- 确认目标包名与 `package.json` 完全一致；
- 确认子项目被 `pnpm-workspace.yaml#packages` 包含，且没有被 `!` 规则排除。

## run、dev、build、lint 或 fix 选错项目

这些命令从工作目录解析 `package.json`，并在该目录执行脚本。确认当前目录是否正确，或通过 `--cwd` 指定目标项目：

```bash
run --cwd ./apps/web
dev --cwd ./apps/web
```

相对路径以当前终端目录为基准。

## run 提示没有脚本或没有匹配结果

- `package.json` 未配置 `scripts` 或其为空时，命令会警告并结束。
- `run <关键词>` 没有匹配结果时会报错；执行不带关键词的 `run` 可以查看全部脚本。
- 确认 `--cwd` 指向目标项目，且脚本定义在该项目的 `package.json#scripts` 中。

## Catalog 修改后锁文件没有变化

Catalog 管理命令不会自动安装。审阅修改后运行：

```bash
git diff -- package.json pnpm-workspace.yaml
pnpm install
```

`remove` 是例外：只有它在 catalog 清理确实改变 workspace YAML 时自动安装。

## 合并 catalog 报版本冲突

`catalog rename` 合并到已有目标时，同一个依赖必须具有完全相同的版本字符串。先决定应保留的版本并手动统一两个 catalog，再重新执行。

## clearn 没有删除锁文件

默认清理只在传入 `--lockfile` 时删除对应包管理器的锁文件。工作区配置 `pnpm-workspace.yaml` 不属于锁文件，会被保留；但 `clearn --all` 会清空工作目录中除顶层 `.git` 外的所有内容，包括工作区配置和锁文件。

## create 与 init 创建模板项目有什么区别

`create` 只选择模板和目标目录并下载文件，默认目录来自模板。`init <name>` 还会填写描述、替换 `package.json` 和 `README.md` 中的占位符，并支持 `--git`。两者都不会自动安装依赖，详见 [`create`](/commands/create#与-init-的区别)。

## ni 为什么自动批准依赖构建脚本

当前实现会检测 pnpm 输出中的 `Ignored build scripts:` 列表，并自动执行 `approve-builds --all`。此行为适用于普通安装及 catalog 分组安装，且批准范围是所有待审批的构建脚本。详见 [ni 的构建脚本审批](/commands/ni#pnpm-构建脚本审批)。

## init 是否安全用于已有项目

无参数 `init` 不适合已有项目：检测到 `package.json` 后会直接清空工作目录中除 `.git` 外的内容。

模板模式 `init <name>` 会提示选择目标目录，默认是 `<name>`。如果目标目录已存在，命令会直接清空其中除 `.git` 外的内容，不会询问是否覆盖，也不要求目录中存在 `package.json`。`create` 使用相同的目录清理行为。相对路径以工作目录（或 `--cwd` 指定的目录）为基准；选择 `.` 会清空工作目录。请使用新目录，或先备份目标目录中的内容。

模板模式不会自动安装依赖。生成后请进入目标目录，按模板要求安装依赖；需要初始化 Git 时传入 `--git`。

## 如何报告问题

请在 [GitHub Issues](https://github.com/lonewolfyx-collective/pm/issues) 提供：

- `@lonewolfyx/pm` 版本；
- Node.js 与包管理器版本；
- 执行命令和工作目录；
- 相关 `package.json`、`pnpm-workspace.yaml` 的最小片段；
- 完整错误输出，以及问题是否能稳定复现。
