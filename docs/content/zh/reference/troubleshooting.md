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

只有传入 `--lockfile` 且成功检测包管理器时才删除对应锁文件。工作区配置 `pnpm-workspace.yaml` 永远保留。

## init 是否安全用于已有项目

无参数 `init` 不适合已有项目：检测到 `package.json` 后会清空除 `.git` 外的内容。模板模式 `init <name>` 虽然会先询问，但确认覆盖同样会清空当前工作目录。请在空目录运行，或先提交和备份。

## 如何报告问题

请在 [GitHub Issues](https://github.com/lonewolfyx-collective/pm/issues) 提供：

- `@lonewolfyx/pm` 版本；
- Node.js 与包管理器版本；
- 执行命令和工作目录；
- 相关 `package.json`、`pnpm-workspace.yaml` 的最小片段；
- 完整错误输出，以及问题是否能稳定复现。
