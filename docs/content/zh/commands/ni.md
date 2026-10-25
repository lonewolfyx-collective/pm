# ni：安装依赖

`ni` 根据项目检测结果调用对应包管理器。没有包名时安装全部依赖；有包名时添加依赖。

## 用法

```text
ni [options] [package...]
```

```bash
ni
ni vue axios
ni -D typescript vite
ni -O sharp
ni --peer vue
```

在 pnpm 项目中，它们分别对应 `pnpm install`、`pnpm add`，以及带 `-D`、`-o` 或 `--save-peer` 的添加操作。

未检测到包管理器时，默认使用 npm。

## 选项

| 选项 | 说明 |
| --- | --- |
| `-d`, `-D`, `--dev-dependencies` | 添加到开发依赖 |
| `-o`, `-O`, `--optional-dependencies` | 添加到可选依赖 |
| `-p`, `--peer`, `--peer-dependencies` | 添加到 peer 依赖 |
| `--catalog` | 按规则和交互选择将包分配到 catalog，仅支持 pnpm |
| `--catalog-name <name>` | 将本次全部包保存到指定 catalog，仅支持 pnpm |
| `-c`, `--cwd <dir>` | 指定工作目录 |

当多个依赖类型选项同时出现时，工具会把对应参数全部传给底层包管理器。是否接受该组合由底层包管理器决定，通常应只选择一种依赖类型。

## 自动与交互式 catalog 分配

```bash
ni --catalog -D eslint tsdown vite vitest
```

处理顺序如下：

1. `eslint` 根据规则进入 `lint`；
2. `tsdown` 和 `vite` 根据规则进入 `build`；
3. `vitest` 没有匹配规则，终端要求选择 catalog；
4. 每组通过 pnpm 的 `--save-catalog --save-catalog-name <name>` 分别安装。

未匹配的包可以分批选择不同 catalog；自定义名称只能包含英文字母和数字。

如果整批依赖都属于同一个 catalog，可以跳过交互：

```bash
ni --catalog-name test -D vitest @vitest/coverage-v8
```

## pnpm 构建脚本审批

执行 pnpm 安装或添加依赖时，工具会捕获输出中的 `Ignored build scripts:` 包列表。检测到该列表后，会自动调用同一个可执行程序运行 `approve-builds --all`，不再提供额外的交互确认。

这会批准所有待审批的依赖构建脚本，范围不限于本次指定的包。若安装以 `ERR_PNPM_IGNORED_BUILDS` 失败且同时输出了可解析的包列表，工具仍会继续执行审批；其他安装错误会继续抛出。

## 参数约束

- `--catalog` 与 `--catalog-name` 不能同时使用；
- 两个 catalog 选项都要求至少一个包名；
- 两个 catalog 选项只支持检测结果为 pnpm 的项目；
- 包名会去重后再执行；
- 取消任意 catalog 选择会终止本次安装，并设置非零退出码。
