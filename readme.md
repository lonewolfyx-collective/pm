# @lonewolfyx/pm

~~Hand-editing `pnpm-workspace.yaml` after every `pnpm add`.~~

Interactive CLI tools for package management, with first-class support for pnpm catalogs and monorepos. ✨


## 📦 Install

```bash
pnpm i -g @lonewolfyx/pm
```

Installs the `ni`, `remove`, `catalog`, `dev`, `build`, `clearn` and `init` commands globally. The active package manager is auto-detected from lockfiles and the `packageManager` field.


## 🚀 Commands

| Command | Description |
| --- | --- |
| `ni` | Install packages, interactively assign them to catalogs |
| `remove` | Remove dependencies across workspace projects and prune unused catalogs |
| `catalog` | Move catalog dependencies, remove dependencies or catalogs, and rename catalogs |
| `dev` / `build` | Fuzzy-find and run the matching `dev` / `build` script |
| `clearn` | Remove build artifacts and stale lockfiles |
| `init` | Scaffold a project in a monorepo workspace |


### `ni`

Without packages it's a plain install, with packages it's an add — expanded for the detected package manager:

```bash
ni
# pnpm install

ni vite axios
# pnpm add vite axios

ni -D oxlint
# pnpm add -D oxlint

ni -O sharp
# pnpm add -O sharp
```

#### Catalog assignment (pnpm only)

Pass `--catalog` to route packages into catalogs instead of hand-editing `pnpm-workspace.yaml`:

```bash
ni --catalog eslint vite vitest axios
```

1. Packages matching the built-in rules are assigned automatically — `eslint` to `catalog:lint`, `vite` to `catalog:build` — following [categorize deps](https://antfu.me/posts/categorize-deps).
2. For the rest, pick a catalog from the built-in list (or type a custom name), then multi-select which of the remaining packages go into it — repeat until everything is assigned.
3. Each group is installed with `--save-catalog --save-catalog-name <name>`, so the catalog entry and the `catalog:` specifier land in one go.

Skip the prompts by naming the catalog up front:

```bash
ni --catalog-name prod axios
# pnpm add axios --save-catalog --save-catalog-name prod
```


### `remove`

```bash
remove vitest
# pnpm remove vitest

remove eslint vite
# pnpm remove eslint vite
```

The flag (`-P`, `-D`, `-O`) follows the field where the dependency is declared. In a monorepo, the right scope is added for you — `-w` at the root, `-F <name>` for a workspace project. When several projects declare the same dependency, pick the targets from a multiselect that shows every declaration, including resolved catalog versions.

Afterwards, catalog entries that nothing references anymore are pruned from `pnpm-workspace.yaml` — including catalogs left empty — and an install is run to sync the lockfile.

### `catalog`

Manage `pnpm-workspace.yaml` catalogs through a standalone CLI:

```bash
catalog move tsdown --to build
catalog remove tsdown
catalog remove --catalog build
catalog rename --from build --to unbuild
catalog --unUsed
```

- `move` keeps the dependency's version and updates references to its destination. Use `--to default` to move it to the default `catalog`. New catalog names are supported.
- `remove <dependency>` deletes its catalog entry. If it is in use, confirmation is required before also removing its matching dependency declarations and workspace overrides.
- `remove --catalog <name>` deletes unused entries, moves referenced entries to the default `catalog`, and updates their references to `catalog:`. A referenced default catalog cannot be removed.
- `rename` keeps all entries and updates references. `--form` and `-to` are accepted for compatibility with the original command spelling.
- `--unUsed` lists dependencies without references in their catalog and catalogs without any references, including empty catalogs. After one confirmation, it removes all listed entries and catalogs. If there is nothing to remove, it exits without prompting or writing files.

Missing arguments are filled through `@clack/prompts`. `catalog remove` first asks whether to remove a dependency or a catalog; `catalog remove --catalog` goes directly to catalog selection. `catalog move` selects a dependency and destination, while `catalog rename` selects the source and asks for a new name. When a dependency exists in several catalogs, select its source catalog.

The CLI finds the workspace from the current directory or `-c, --cwd <dir>` (after the subcommand). It scans the root `package.json` and workspace packages, respecting excluded workspace patterns. References in all four dependency fields and workspace `overrides` are handled. Conflicts with existing destination entries or names abort without writing files, and cancelling a prompt also leaves files unchanged.

Catalog changes do not run an install automatically. Run `pnpm install` afterwards to sync the lockfile.

The catalog regression tests run with `pnpm test` on Node.js 24, using Node's built-in test runner and module mocks for prompt responses.

### `dev` & `build`

Fuzzy-find the script to run — handy when a project grows `dev:docs`, `dev:play` and friends:

```bash
dev
# matches "dev", "dev:docs", "dev:play", … → pick one → pnpm run dev:docs

build
# same for "build" scripts
```

### `clearn`

Reclaim disk space from "old stuff" — dependency and build artifact folders scattered across a project, or a whole monorepo:

```bash
clearn
# walks the project, deletes every match, then prints what was removed

clearn --lock
# also removes the lockfile of the detected package manager
```

<details>
<summary>What gets removed?</summary>

`node_modules`, `dist`, `build`, `out`, `.nuxt`, `.next`, `.output`, `.svelte-kit`, `.docusaurus`, `.turbo`, `.cache`, `.parcel-cache`, `.temp`, `.serverless`, `.firebase`, `.tern-port`, `jspm_packages`, `web_modules`, `.build`, `.dynamodb`, `.fusebox`, `Carthage`, `.vuepress/dist` — and, with `--lock`, the current package manager's lockfile.

</details>

### `init`

```bash
init --monorepo
# select a workspace folder (packages/, apps/, …) for a new project —
# or type a name to create the folder and register `name/*` in pnpm-workspace.yaml

init
# create an empty readme.md in the project
```

## Global Flags

Every command accepts:

- `-c, --cwd <dir>` — specify the working directory



## 💡 Why package manage(pm)?

- **Catalogs without the ceremony.** No remembering `--save-catalog --save-catalog-name`, no hand-editing `pnpm-workspace.yaml`, no copy-pasting version ranges.
- **Categorizing deps, decided once.** Group a whole batch of packages into catalogs in a single interactive pass.
- **Monorepo-aware removal.** pm finds every project that declares the dependency and runs the uninstall with the right `-w` / `-F` scope.
- **No orphaned catalogs.** Removed dependencies' catalog entries are pruned automatically, empty catalogs included.
- **One command for cleanup.** `clearn` sweeps `node_modules`, `dist`, `.nuxt`, `.turbo` and more from every corner of a monorepo.


## 🗂️ What is a Catalog?

A catalog is pnpm's way of keeping dependency versions in one place: declare versions once in `pnpm-workspace.yaml`, then reference them from any `package.json` as `catalog:` (default catalog) or `catalog:<name>` (named catalog).

```yaml
# pnpm-workspace.yaml
catalog:
  vitest: ^3.2.0

catalogs:
  lint:
    eslint: ^9.30.0
```

```json
{
  "devDependencies": {
    "vitest": "catalog:",
    "eslint": "catalog:lint"
  }
}
```
