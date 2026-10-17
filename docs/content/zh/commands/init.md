# init：初始化项目

`init` 根据参数选择四种互斥流程。匹配优先级为：

1. `--github`
2. `--monorepo`
3. 位置参数中的项目名
4. 无参数的包配置初始化

同时传入多种模式时，只执行优先级最高的一种。

## 初始化包配置

```bash
init
```

此模式依次：

1. 从 GitHub 的 Node `.gitignore` 模板生成 `.gitignore`；
2. 运行 `pnpm init`；
3. 安装项目约定的 TypeScript、ESLint、Git hooks 等开发依赖；
4. 标准化 `package.json`；
5. 生成 `eslint.config.ts` 并运行 `pnpm lint:fix`。

::: danger 会清空当前目录
如果工作目录已存在 `package.json`，当前实现会直接删除工作目录内除 `.git` 外的所有内容，然后重新初始化，不会再次询问。仅应在空目录或确认可以重建的目录中运行。
:::

此流程需要网络连接，因为会获取 `.gitignore` 并安装依赖。

## 从模板创建项目

```bash
init my-project
init my-project --git
```

命令交互选择模板并填写描述，然后通过内置创建器生成项目。`--git` 会同时初始化 Git。

如果当前工作目录已有 `package.json`，命令会询问是否覆盖；确认后清空当前目录（保留 `.git`），再继续生成。取消则不修改。

## 创建 monorepo 包

```bash
init my-package --monorepo
init --monorepo
```

工具读取 `pnpm-workspace.yaml#packages` 并列出可用工作区目录。没有工作区时，可以创建一个；也可以选择自定义目录，自定义目录会以 `<folder>/*` 写入 workspace 配置。

未提供包名时会交互输入。随后创建 `<workspace>/<package>/package.json`，使用内置 ESM 库模板。此模式只创建目录和清单，不生成源码，也不安装依赖。

::: info 自定义目录限制
交互输入只接受单层目录名，不接受 `.`、`..`、斜杠或反斜杠。
:::

## 添加 GitHub 工作流

```bash
init --github
```

命令读取当前 Git 仓库的 `origin`，下载 `lonewolfyx-workflows/github-workflows` 模板并写入 `.github`。如果模板文件与现有文件冲突，会要求选择哪些文件可以覆盖；未选中的文件保持原样。临时下载目录在结束时删除。

运行前应确保当前目录是具有有效 `origin` 的 Git 仓库，并先提交或备份 `.github` 中的重要改动。

## 选项

| 选项 | 说明 |
| --- | --- |
| `<package>` | 项目或工作区包名称 |
| `--monorepo` | 创建工作区包 |
| `--github`, `--ci`, `--ci-cd`, `--cd` | 添加 GitHub CI/CD 文件 |
| `--git` | 模板项目生成时初始化 Git |
| `-p`, `--dependencies` | 当前版本已声明但尚未影响执行流程 |
| `-c`, `--cwd <dir>` | 指定工作目录 |
