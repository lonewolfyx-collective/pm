# 参与文档维护

文档使用 VitePress。英文内容位于 `docs/content/en/`，中文内容位于 `docs/content/zh/`，两种语言保持相同的页面结构。共享站点配置位于 `docs/.vitepress/config.ts`；默认中文主题配置位于 `docs/content/config.ts`，英文覆盖配置位于 `docs/content/en/config.ts`。

## 本地开发

```bash
pnpm install
pnpm docs:dev
```

开发服务器支持热更新。修改 Markdown 或 `docs/.vitepress/config.ts` 后，浏览器会自动刷新。

## 构建与预览

```bash
pnpm docs:build
pnpm docs:preview
```

生产文件输出到 `docs/.vitepress/dist`。预览命令读取该构建结果，因此应先成功执行 `docs:build`。

## 内容约定

- 命令行为以 `src/commands/` 与对应参数定义为准；
- 示例必须可以直接复制，并明确是否会修改或删除文件；
- 新增命令选项时，同步更新命令页与 [CLI 速查](./cli)；
- Catalog 行为变化时，同步更新概念说明与 `catalog` 命令页；
- 使用无扩展名的站内链接，提交前检查死链和构建结果。

## 提交前检查

```bash
pnpm lint
pnpm build
pnpm docs:build
```

提交信息和 PR 标题需遵循仓库 `AGENTS.md` 中的 Conventional Commits 规范。文档变更通常可使用 `docs: <description>`。
