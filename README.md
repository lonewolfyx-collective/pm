# @lonewolfyx/pm

CLI tools for dependency management, pnpm catalogs, and workspace projects. Install and remove packages, organize shared versions, choose project scripts, and clean generated files from the terminal.

## Installation

```bash
pnpm add -g @lonewolfyx/pm
```

The package provides seven commands:

| Command | Purpose |
| --- | --- |
| `ni` | Install dependencies or add packages, with optional catalog assignment |
| `remove` | Remove dependencies from selected projects and clean unused catalog entries |
| `catalog` | Move dependencies, rename catalogs, preview catalog removal, or clean unused entries |
| `dev` | Find and run a script matching `dev` |
| `build` | Find and run a script matching `build` |
| `clearn` | Delete dependency directories, build output, and caches |
| `init` | Generate a project or create a workspace package manifest |

Package operations use the detected package manager. Catalog installation with `ni` requires pnpm; `catalog` commands require a `pnpm-workspace.yaml` file.

## Working directory and workspace scope

Commands accept `-c, --cwd <dir>` to specify a working directory:

```bash
ni vite --cwd ./apps/web
catalog move vite --to dev --cwd ./apps/web
clearn --cwd ./apps/web
```

Workspace discovery searches upward for `pnpm-workspace.yaml`. Projects are matched against its `packages` patterns, including exclusions such as `!packages/legacy`; `node_modules` and `.git` are excluded from discovery.

Catalog operations inspect the current project's `package.json` and the matched workspace projects. They consider `dependencies`, `devDependencies`, `optionalDependencies`, and `peerDependencies`, along with catalog references in workspace `overrides`.

`dev` and `build` currently read script names from the terminal's current directory. Run them from the project whose scripts you want to select.

## Install and add packages

Without package names, `ni` installs the project's dependencies. With package names, it adds them:

```bash
ni
ni vite axios
ni -D tsdown
ni -O sharp
```

In a pnpm project, these correspond to `pnpm install`, `pnpm add vite axios`, `pnpm add -D tsdown`, and `pnpm add -O sharp`.

| Option | Purpose |
| --- | --- |
| `-d`, `-D`, `--dev-dependencies` | Add development dependencies |
| `-o`, `-O`, `--optional-dependencies` | Add optional dependencies |
| `--catalog` | Assign packages using catalog rules and interactive selection |
| `--catalog-name <name>` | Assign all packages to a specified catalog |

### Assign packages to catalogs

```bash
ni --catalog -D eslint tsdown vite vitest
```

Packages with matching rules are assigned automatically. For unmatched packages, select a built-in or custom catalog, then select which remaining packages belong to it. Repeat until every package has a destination.

Each group is installed with pnpm's `--save-catalog` and `--save-catalog-name` options. To choose one destination for the entire batch:

```bash
ni --catalog-name dev -D tsdown vite
```

`--catalog` and `--catalog-name` are mutually exclusive, require at least one package name, and are available only in pnpm projects.

## Catalogs

Catalogs centralize dependency versions in `pnpm-workspace.yaml`. A project references the default catalog with `catalog:` and a named catalog with `catalog:<name>`.

```yaml
# pnpm-workspace.yaml
packages:
  - packages/*

catalog:
  typescript: ^6.0.0

catalogs:
  build:
    tsdown: ^0.23.0
    vite: ^8.0.0
```

```json
{
  "devDependencies": {
    "typescript": "catalog:",
    "tsdown": "catalog:build",
    "vite": "catalog:build"
  }
}
```

### Classification rules

`ni --catalog` and `catalog move` share the rules in [src/catalog/rules.ts](src/catalog/rules.ts):

| Catalog | Matching packages |
| --- | --- |
| `lint` | `eslint`, `@eslint/*`, `@antfu/eslint-config`, `oxlint`, `oxfmt` |
| `build` | `tsdown`, `vite` |

Rules support exact names and prefixes ending in `*`. The first matching rule wins. Installation rules also recognize package names with versions and npm aliases.

The built-in selection list contains `test`, `lint`, `build`, `script`, `frontend`, `backend`, `types`, `inlined`, `prod`, `dev`, and `config`. Categories without package patterns are available for selection; their names alone do not classify packages automatically. Custom catalogs are also supported.

### Move dependencies

`catalog move <pkg...>` moves every matching dependency declaration to its destination catalog, whether the declaration uses a version string, `catalog:`, or a named catalog reference.

```bash
# Move one package using its classification rule: vite → build
catalog move vite

# Move multiple packages using their individual rules
catalog move eslint tsdown vite

# Override the rules for the entire batch
catalog move tsdown vite --to dev
catalog move tsdown vite -t dev

# Use the default catalog
catalog move vite --to default
```

At least one package name is required. Each requested package must appear in a scanned project's dependency declarations.

The destination is chosen in this order:

1. The name supplied with `--to` or `-t`.
2. The package's matching classification rule.
3. Interactive selection from built-in, existing, or custom catalogs.

If a package matches a rule, no destination prompt appears. For example, `catalog move vite` uses `build`; an existing `catalog:build` declaration already points to that destination.

The destination version is chosen in this order:

1. The package's existing entry in the destination catalog.
2. The current project's declaration, resolving catalog references to their versions.
3. The first matching workspace project's declaration, when the current project does not declare the package.

All matching projects then use that version through the destination reference. This can change the version used by projects that previously declared different versions. When a project declares a package in multiple fields, the lookup order is `dependencies`, `devDependencies`, `optionalDependencies`, then `peerDependencies`.

The command updates matching catalog references in `overrides` and removes the migrated entries from their referenced source catalogs. Unrelated entries and empty source catalogs remain. Changes are saved after the entire batch has been processed; cancelling a destination prompt does not save the planned changes.

### Rename or merge a catalog

```bash
catalog rename --from build --to tooling
catalog rename -f build -t tooling

# Select the source catalog interactively
catalog rename --to tooling
```

The source must be a named catalog. The destination is required and may be a new name, an existing catalog, or `default`.

If the destination exists, entries are merged. Duplicate packages with identical version strings are kept once; different version strings abort the merge before saving. References in all four dependency fields and workspace `overrides` are updated, and the source catalog is removed.

### Preview removal of a named catalog

```bash
catalog remove
catalog remove --catalog build
```

The current implementation prints the proposed workspace state as JSON and does not save files.

Select a named catalog if `--catalog` is omitted, then choose how its dependencies should be kept:

| Choice | Proposed changes |
| --- | --- |
| Move to the default catalog | Copy entries into `catalog` and rewrite references to `catalog:` |
| Restore versions | Replace catalog references in dependency declarations and overrides with their version strings |

The default catalog cannot be selected for removal. Moving entries into the default catalog aborts if it already contains a different version of a package. This subcommand removes a catalog as a whole; use the standalone `remove` command to uninstall packages.

### Clean unused catalog entries

```bash
catalog --unUsed
catalog -u
```

The command lists unused dependency entries and catalogs with no references, then asks for confirmation before deleting them. Catalog references in the four dependency fields and matching workspace overrides count as usage. Workspace overrides are kept.

If nothing is unused, the command exits without prompting. Declining or cancelling confirmation leaves files unchanged.

### Sync the lockfile

`catalog move`, `catalog rename`, and confirmed unused-entry cleanup save their changes without running an install. Afterwards, run:

```bash
pnpm install
```

`catalog remove` currently produces a preview only, so it does not modify the lockfile or dependency files.

## Remove dependencies

```bash
remove vite
remove eslint tsdown
```

The standalone `remove` command finds declarations in `dependencies`, `devDependencies`, and `optionalDependencies`. Peer-only declarations are not removal candidates.

When only one project declares a package, that project is selected automatically. When several projects declare it, choose the targets from a multiselect showing their dependency fields, specifiers, and resolved catalog versions. All selections are completed before uninstall commands start.

The dependency field determines the uninstall flag. In a workspace, removal uses `-w` for the current project and `-F <name>` for other matched projects.

After uninstalling, the command removes affected catalog entries when no remaining project or matching override references them. Peer dependency references also count during this cleanup. Unreferenced affected catalogs and empty catalogs are cleaned up; if the workspace YAML changes, an install runs to sync the lockfile.

## Run development and build scripts

```bash
dev
build
```

These commands fuzzy-match script names in `package.json`. For example, `dev` may match `dev`, `dev:docs`, and `dev:play`.

A single match runs automatically. Multiple matches open a selector showing each script's command. No matches produce an error. The chosen script runs through the detected package manager.

## Clean generated files

The command is spelled `clearn`:

```bash
clearn
clearn --lockfile
```

It searches recursively beneath the working directory and deletes matching targets immediately, without confirmation. `.git` and symbolic links are skipped.

By default, it removes dependency directories, build output, and caches:

```text
node_modules       jspm_packages      web_modules
dist               build              out
.nuxt              .next              .output
.svelte-kit        .docusaurus        .vuepress/dist
.cache             .parcel-cache      .temp
.turbo             .build             .serverless
.fusebox           .dynamodb          .firebase
.tern-port         Carthage
```

`--lockfile` also removes recognized lockfiles for the detected package manager. `pnpm-workspace.yaml` is preserved. If the package manager cannot be detected, lockfiles are preserved.

## Initialize a project

### Generate a project in the current directory

```bash
init
```

This runs `npx -y @lonewolfyx/setup` in the working directory. If an existing `package.json` is found, it asks before deleting the directory's contents to generate a replacement project; `.git` is preserved.

### Create a workspace package

```bash
init --monorepo
```

Choose an existing workspace folder or enter a custom folder, then provide the package name. The command creates a directory and a `package.json` using its built-in library template.

If no workspace folders are found, it asks whether to create one. Custom folders are registered as `<folder>/*` in `pnpm-workspace.yaml`; the workspace file is created when needed. This mode creates the package manifest without running the external project generator.
