# Getting Started

## Installation

Install the CLI globally with pnpm:

```bash
pnpm add -g @lonewolfyx/pm
```

The package provides these commands:

```bash
ni --help
catalog --help
remove --help
run --help
dev --help
build --help
lint --help
fix --help
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

## Run Package Scripts

Use `run` to select a script from `package.json#scripts`, or supply a keyword for fuzzy matching:

```bash
run
run docs
```

Without a keyword, the selector always opens. With a keyword, a single match runs automatically, multiple matches open a selector, and no matches produce an error. Missing or empty scripts produce a warning and end the command. `dev`, `build`, `lint`, and `fix` use their command names as fixed keywords; see [Run Scripts](/en/commands/scripts).

## Set the Working Directory

Every command accepts `-c, --cwd <dir>`:

```bash
ni vite --cwd ./apps/web
remove lodash --cwd ./packages/utils
catalog move vite --cwd ./apps/web
run docs --cwd ./apps/web
clearn --cwd ./apps/web
```

Relative paths are resolved from the terminal's current directory. Workspace discovery searches upward from the resulting directory for `pnpm-workspace.yaml`.

`run`, `dev`, `build`, `lint`, and `fix` resolve `package.json` from the specified working directory and execute the selected script in that directory.

## Next Steps

- Read [Working Directory and Workspaces](./workspace) for repository discovery rules.
- Read [pnpm Catalogs](./catalog) to centralize dependency versions.
- Use the [CLI Cheat Sheet](/en/reference/cli) for a compact list of commands and options.
