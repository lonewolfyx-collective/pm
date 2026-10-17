# Getting Started

## Installation

Install the CLI globally with pnpm:

```bash
pnpm add -g @lonewolfyx/pm
```

The package provides seven commands:

```bash
ni --help
catalog --help
remove --help
dev --help
build --help
clearn --help
init --help
```

Use `--version` to print the installed CLI version.

## First Steps

Run `ni` without package names to install all dependencies declared by an existing project:

```bash
cd my-project
ni
```

Add common dependency types:

```bash
# Production dependency
ni vue

# Development dependencies
ni -D typescript vite

# Optional dependency
ni -O sharp

# Peer dependency
ni --peer vue
```

The tool detects the package manager used by the project. In a pnpm project, for example, these calls resolve to `pnpm install` or `pnpm add`. Projects using npm, Yarn, or another supported package manager receive the corresponding command.

## Set the Working Directory

Every command accepts `-c, --cwd <dir>`:

```bash
ni vite --cwd ./apps/web
remove lodash --cwd ./packages/utils
catalog move vite --cwd ./apps/web
clearn --cwd ./apps/web
```

Relative paths are resolved from the terminal's current directory. Workspace discovery searches upward from the resulting directory for `pnpm-workspace.yaml`.

::: warning Directory behavior of dev and build
The current version reads candidate scripts from the terminal's current directory. To ensure the selected script and its execution directory match, `cd` into the target project before running `dev` or `build` instead of relying on `--cwd`.
:::

## Next Steps

- Read [Working Directory and Workspaces](./workspace) for repository discovery rules.
- Read [pnpm Catalogs](./catalog) to centralize dependency versions.
- Use the [CLI Cheat Sheet](/en/reference/cli) for a compact list of commands and options.
