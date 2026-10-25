# CLI Cheat Sheet

## Shared Options

| Option | Commands | Description |
| --- | --- | --- |
| `-c`, `--cwd <dir>` | All commands | Set the working directory; defaults to the terminal's current directory |
| `--help` | All commands | Display help |
| `--version` | All commands | Display the CLI version |

## Commands and Examples

| Goal | Command |
| --- | --- |
| Install all project dependencies | `ni` |
| Add production dependencies | `ni vue axios` |
| Add development dependencies | `ni -D typescript vite` |
| Add optional dependencies | `ni -O sharp` |
| Add peer dependencies | `ni --peer vue` |
| Assign catalogs interactively | `ni --catalog -D eslint vite vitest` |
| Assign one catalog to a batch | `ni --catalog-name test -D vitest` |
| Remove dependencies | `remove vite` |
| Move dependencies by rule | `catalog move eslint vite` |
| Select a move destination | `catalog move vite --to build` |
| Rename or merge a catalog | `catalog rename --from build --to tooling` |
| Remove a catalog | `catalog remove --catalog tooling` |
| Clean unused catalog entries | `catalog -u` |
| Select from all package scripts | `run` |
| Fuzzy-match scripts by keyword | `run docs` |
| Match scripts in a specified project | `run docs --cwd ./apps/web` |
| Select a development script | `dev` |
| Select a build script | `build` |
| Select a lint script | `lint` |
| Select a fix script | `fix` |
| Clean generated output and caches | `clearn` |
| Clean lockfiles too | `clearn --lockfile` |
| Clear a directory, keeping only its top-level `.git` | `clearn --all --cwd ./temporary-project` |
| Interactively select and download a project template | `create` |
| Create a template project under a specified working directory | `create --cwd ./apps` |
| Initialize package configuration | `init` |
| Create a project from a template | `init my-project --git` |
| Create a workspace package | `init my-package --monorepo` |
| Add GitHub workflows | `init --github` |

## Catalog Subcommand Options

| Command | Option | Description |
| --- | --- | --- |
| `catalog move` | `-t`, `--to <name>` | Destination catalog for every supplied dependency |
| `catalog rename` | `-f`, `--from <name>`, `--form <name>` | Source named catalog; select interactively when omitted |
| `catalog rename` | `-t`, `--to <name>` | Destination catalog; required on the command line |
| `catalog remove` | `--catalog <name>` | Named catalog to remove; select interactively when omitted |
| `catalog` | `-u`, `--unUsed` | List and confirm deletion of unused entries |

## Other Command Options

| Command | Option | Description |
| --- | --- | --- |
| `ni` | `-d`, `-D`, `--dev-dependencies` | Add development dependencies |
| `ni` | `-o`, `-O`, `--optional-dependencies` | Add optional dependencies |
| `ni` | `-p`, `--peer`, `--peer-dependencies` | Add peer dependencies |
| `ni` | `--catalog` | Assign catalogs by rule and interaction; pnpm only |
| `ni` | `--catalog-name <name>` | Save a batch to one catalog; exclusive with `--catalog` |
| `run` | `[keyword]` | Fuzzy-match script names; omit to list all scripts |
| `clearn` | `--lockfile` | Also clean lockfiles for the detected package manager |
| `clearn` | `--all` | Clear the working directory except its top-level `.git`, without confirmation |
| `init` | `[package]` | Default template directory or workspace package name |
| `init` | `--monorepo` | Select or create a workspace and generate a package manifest |
| `init` | `--github`, `--ci`, `--ci-cd`, `--cd` | Add GitHub workflows |
| `init` | `--git` | Initialize Git when generating a template project |
| `init` | `-p`, `--dependencies` | Declared but currently does not change behavior |

`create` declares only shared options; choose the template and directory at its prompts. When pnpm outputs a list of ignored build scripts, `ni` automatically runs `approve-builds --all`; see [ni](/en/commands/ni#pnpm-build-script-approval).

::: tip Check the installed version
After an upgrade, run `<command> --help` or `catalog <subcommand> --help` to see the arguments accepted by that exact version.
:::
