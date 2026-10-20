# run / dev / build / lint / fix：运行脚本

`run`、`dev`、`build`、`lint` 和 `fix` 从 `package.json#scripts` 中查找脚本，并通过检测到的包管理器运行。传入关键词时使用模糊匹配。

## 用法

```bash
run
run docs
dev
build
lint
fix
```

假设项目包含：

```json
{
  "scripts": {
    "dev": "vite",
    "dev:docs": "vitepress dev docs",
    "build": "tsdown",
    "build:docs": "vitepress build docs",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

- `run` 显示所有脚本供选择，即使只有一个脚本也需要选择；
- `run docs` 会匹配 `dev:docs`、`build:docs`，并显示选择器；
- `dev` 会匹配 `dev`、`dev:docs`，并显示选择器；
- `build` 会匹配 `build`、`build:docs`，并显示选择器；
- `lint` 会匹配 `lint`、`lint:fix`，并显示选择器；
- `fix` 只有 `lint:fix` 一个匹配结果，直接运行；
- 指定关键词或使用 `dev`、`build`、`lint`、`fix` 时，只有一个匹配结果就直接运行；
- 未配置 `scripts` 或其为空时，警告并结束；
- 关键词没有匹配结果时报错；
- 取消选择会以非零退出码结束。

选择器同时显示脚本名和实际命令。选定后会执行相当于 `<package-manager> run <script>` 的命令。

## 工作目录

默认从终端当前目录解析 `package.json`。使用 `--cwd` 时，脚本读取和执行都使用指定目录：

```bash
run --cwd ./apps/web
dev --cwd ./apps/web
```
