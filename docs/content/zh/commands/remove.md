# remove：移除依赖

`remove` 从当前项目或 pnpm 工作区项目中卸载依赖，并在安全时清理对应 catalog 项。

## 用法

```text
remove [options] <package...>
```

```bash
remove vite
remove eslint tsdown
remove lodash --cwd ./apps/web
```

每个包都必须出现在某个项目的 `dependencies`、`devDependencies` 或 `optionalDependencies` 中，否则命令报错。仅存在于 `peerDependencies` 的包不是移除候选。

## 项目选择

单个项目声明依赖时会自动选中。多个项目声明同一依赖时，终端列出：

- 工作区包名；
- 声明所在的依赖字段；
- 当前 specifier；
- catalog 引用解析后的实际版本（如可用）。

工具会先完成所有包的目标选择，再开始执行卸载。选择期间取消，不会修改文件。

## 执行方式

依赖只出现在一个字段时，工具把对应类型参数传给包管理器；出现在多个字段时，不额外传类型参数。pnpm monorepo 中：

- 当前根项目使用 workspace-root 参数；
- 子项目使用 `-F <package-name>` 过滤。

## Catalog 清理

卸载完成后，工具检查受影响的 catalog 项：

1. 扫描根项目与已发现的工作区项目；
2. 将四类依赖字段和匹配的 workspace `overrides` 都视为引用；
3. 删除已经没有引用的受影响项；
4. 删除没有任何引用的空 catalog；
5. 如果工作区 YAML 发生变化，自动运行一次安装来同步锁文件。

清理只处理本次卸载涉及的 catalog 依赖，不会顺带删除其他无用项。全面检查请运行 [`catalog -u`](./catalog#清理无用项)。

::: warning 执行前确认范围
卸载命令会真实修改项目清单和锁文件。特别是在 monorepo 中，请认真核对交互列表里的包名和依赖字段。
:::
