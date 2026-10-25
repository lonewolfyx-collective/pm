# remove: Remove Dependencies

`remove` uninstalls dependencies from the current project or selected pnpm workspace projects, then safely cleans affected catalog entries.

## Usage

```text
remove [options] <package...>
```

```bash
remove vite
remove eslint tsdown
remove lodash --cwd ./my-monorepo
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

In a monorepo, run from the workspace root or point `--cwd` there. The current implementation treats the manifest resolved from the working directory as the root project; see [Root and Child Projects](/en/guide/workspace#root-and-child-projects).

## Catalog Cleanup

After uninstalling, the tool checks affected catalog entries:

1. Scan the root project and discovered workspace projects.
2. Treat all four dependency fields and matching workspace `overrides` as references.
3. Delete affected entries that no longer have references.
4. Delete affected catalogs that have no remaining references, including their other entries, and clean unreferenced empty named catalogs.
5. Run an install to synchronize the lockfile if workspace YAML changed.

Individual entry cleanup targets catalog dependencies affected by this removal. An affected catalog with no remaining references is deleted entirely. Use [`catalog -u`](./catalog#clean-unused-entries) for a full scan of other unused entries.

::: warning Confirm the scope
Uninstall commands modify project manifests and lockfiles. In a monorepo, carefully review the package names and dependency fields shown by the selector.
:::
