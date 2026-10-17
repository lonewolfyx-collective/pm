# dev / build：运行脚本

`dev` 和 `build` 用模糊匹配在 `package.json#scripts` 中查找脚本，并通过检测到的包管理器运行。

## 用法

```bash
dev
build
```

假设项目包含：

```json
{
  "scripts": {
    "dev": "vite",
    "dev:docs": "vitepress dev docs",
    "build": "tsdown",
    "build:docs": "vitepress build docs"
  }
}
```

- `dev` 会匹配 `dev`、`dev:docs`，并显示选择器；
- `build` 会匹配 `build`、`build:docs`，并显示选择器；
- 只有一个结果时直接运行；
- 没有结果时报错；
- 取消选择会以非零退出码结束。

选择器同时显示脚本名和实际命令。选定后会执行相当于 `<package-manager> run <script>` 的命令。

## 工作目录限制

当前实现从终端当前目录解析 `package.json`，而子进程使用 `--cwd` 指定的目录。这两个目录不一致时，可能从 A 项目选择脚本、却在 B 项目执行。

请使用下面的方式：

```bash
cd ./apps/web
dev
```

不建议：

```bash
dev --cwd ./apps/web
```
