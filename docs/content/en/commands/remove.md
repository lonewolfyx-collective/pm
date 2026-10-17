# remove: Remove Dependencies

`remove` uninstalls dependencies from the current project or selected pnpm workspace projects, then safely cleans affected catalog entries.

## Usage

```text
remove [options] <package...>
```

```bash
remove vite
remove eslint tsdown
remove lodash --cwd ./apps/web
```

Every package must appear in a project's `dependencies`, `devDependencies`, or `optionalDependencies`; otherwise the command fails. A package declared only in `peerDependencies` is not a removal candidate.

## Project Selection

When only one project declares a package, that project is selected automatically. When several projects declare it, the prompt shows:

- the workspace package name;
- each dependency field containing the package;
- the current specifier;
- the resolved catalog version when available.

The tool resolves every package selection before running any uninstall command. Cancelling during selection leaves files unchanged.

## Execution

When a dependency appears in exactly one field, the corresponding dependency-type flag is forwarded to the package manager. When it appears in several fields, no type flag is added. In a pnpm monorepo:

- the current root project uses the workspace-root option;
- child projects use `-F <package-name>`.

## Catalog Cleanup

After uninstalling, the tool checks affected catalog entries:

1. Scan the root project and discovered workspace projects.
2. Treat all four dependency fields and matching workspace `overrides` as references.
3. Delete affected entries that no longer have references.
4. Delete empty catalogs that have no references.
5. Run an install to synchronize the lockfile if workspace YAML changed.

Cleanup is limited to catalog dependencies affected by this removal. Use [`catalog -u`](./catalog#clean-unused-entries) for a full unused-entry scan.

::: warning Confirm the scope
Uninstall commands modify project manifests and lockfiles. In a monorepo, carefully review the package names and dependency fields shown by the selector.
:::
