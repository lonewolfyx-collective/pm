# Maintaining the Documentation

The documentation uses VitePress. English content lives in `docs/content/en/`, Chinese content lives in `docs/content/zh/`, and both locales keep the same page structure. Shared site settings live in `docs/.vitepress/config.ts`; the default Chinese theme config lives in `docs/content/config.ts`, while English overrides live in `docs/content/en/config.ts`.

## Local Development

```bash
pnpm install
pnpm docs:dev
```

The development server supports hot updates. Changes to Markdown or `docs/.vitepress/config.ts` refresh in the browser automatically.

## Build and Preview

```bash
pnpm docs:build
pnpm docs:preview
```

Production output is written to `docs/.vitepress/dist`. The preview command reads that build, so run `docs:build` successfully first.

## Content Conventions

- Treat `src/commands/` and the related argument definitions as the source of truth.
- Keep the English and Chinese directory trees and page topics aligned.
- Make examples directly copyable and clearly call out destructive or mutating behavior.
- When adding a command option, update its command page and the [CLI Cheat Sheet](./cli) in both languages.
- When catalog behavior changes, update the catalog guide and command page in both languages.
- Use extensionless internal links and check dead links before submitting.

## Checks Before Submitting

```bash
pnpm lint
pnpm build
pnpm docs:build
```

Commit messages and PR titles must follow the Conventional Commits rules in the repository's `AGENTS.md`. Documentation-only changes usually use `docs: <description>`.
