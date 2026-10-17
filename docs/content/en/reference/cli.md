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
| Select a development script | `dev` |
| Select a build script | `build` |
| Clean generated output and caches | `clearn` |
| Clean lockfiles too | `clearn --lockfile` |
| Initialize package configuration | `init` |
| Create a project from a template | `init my-project --git` |
| Create a workspace package | `init my-package --monorepo` |
| Add GitHub workflows | `init --github` |

## Catalog Subcommand Options

| Command | Option | Description |
| --- | --- | --- |
| `catalog move` | `-t`, `--to <name>` | Destination catalog for every supplied dependency |
| `catalog rename` | `-f`, `--from <name>` | Source named catalog; select interactively when omitted |
| `catalog rename` | `-t`, `--to <name>` | Destination catalog; required on the command line |
| `catalog remove` | `--catalog <name>` | Named catalog to remove; select interactively when omitted |
| `catalog` | `-u`, `--unUsed` | List and confirm deletion of unused entries |

::: tip Check the installed version
After an upgrade, run `<command> --help` or `catalog <subcommand> --help` to see the arguments accepted by that exact version.
:::
