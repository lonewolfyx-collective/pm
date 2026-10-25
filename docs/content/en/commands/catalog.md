# catalog: Manage Catalogs

`catalog` manages default and named catalogs in `pnpm-workspace.yaml`. Every subcommand requires that file to be discoverable by searching upward from the working directory.

## Move Dependencies

```text
catalog move <package...> [--to <catalog>] [--cwd <dir>]
```

```bash
# Apply each package's built-in rule; prompt when no rule matches
catalog move eslint tsdown vite

# Move the whole batch to one named catalog
catalog move vitest playwright --to test

# Move to the default catalog
catalog move typescript -t default
```

The tool rewrites all four dependency fields across scanned projects. It also updates matching workspace `overrides` that already use catalog references. Corresponding entries are removed from their previous source catalogs; unrelated entries and other empty catalogs are left unchanged.

The destination name must begin with a letter or digit and may then contain letters, digits, dots, underscores, or hyphens. Every requested package must appear in at least one scanned `package.json`.

## Rename or Merge a Catalog

```text
catalog rename [--from <name>] --to <name> [--cwd <dir>]
```

```bash
catalog rename --from build --to tooling
catalog rename -f build -t tooling

# Select the source interactively
catalog rename --to tooling

# Merge into the default catalog
catalog rename --from tooling --to default
```

The source must be a named catalog, not the default catalog. If the destination exists, the command merges entries. Identical package versions are kept once; conflicting version strings abort the operation before saving. Successful operations rewrite source references in every dependency field and workspace `overrides`.

## Remove a Named Catalog

```text
catalog remove [--catalog <name>] [--cwd <dir>]
```

```bash
catalog remove
catalog remove --catalog build
```

The default catalog cannot be removed. After selecting a named catalog, choose how its dependencies should be preserved:

| Choice | Result |
| --- | --- |
| Move to the default catalog | Copy versions into `catalog` and rewrite references to `catalog:` |
| Restore version strings | Replace references in project manifests and overrides with versions from the catalog |

Moving to the default catalog aborts before saving if it already contains a different version of the same dependency.

::: warning Changes are saved
In the current version, `catalog remove` writes `pnpm-workspace.yaml` and project manifests. It is not a preview command. Run `pnpm install` afterwards to synchronize the lockfile.
:::

## Clean Unused Entries

```bash
catalog --unUsed
catalog -u
```

The command lists unreferenced catalog entries and catalogs with no references. It deletes them only after confirmation; declining or cancelling leaves files unchanged. If nothing is unused, it exits without prompting. Workspace `overrides` are preserved, and their catalog references count as usage.

## Saving and the Lockfile

`move`, `rename`, and `remove` update changed `package.json` files before writing `pnpm-workspace.yaml`. Confirmed unused-entry cleanup updates only YAML. These operations do not run an install:

```bash
pnpm install
```

Review version unification, reference rewrites, and catalog removal with `git diff` before synchronizing the lockfile.
