# Working Directory and Workspaces

## Working Directory

The default working directory is the value of `process.cwd()` when the command starts. Override it with the shared option:

```text
-c, --cwd <dir>  Set the working directory
```

Package-manager detection, child-process execution, and most manifest lookups use this directory. Pass a project directory rather than a specific `package.json` file.

## pnpm Workspace Discovery

The tool searches upward from the working directory for the nearest `pnpm-workspace.yaml`, then reads the globs in `packages`:

```yaml
packages:
  - apps/*
  - packages/*
  - '!packages/legacy'
```

Discovery:

- expands positive patterns and reads the matching `package.json` files;
- applies exclusion patterns beginning with `!`;
- always excludes `.git` and `node_modules`;
- sorts and deduplicates paths before reading projects;
- exposes the directory before the first wildcard as an `init --monorepo` workspace choice, such as `apps` or `packages`.

A workspace is treated as a monorepo only when `packages` is a non-empty array. A `pnpm-workspace.yaml` without valid package patterns can still be used for catalog commands, but no child projects are discovered.

## Dependency Fields

Catalog commands inspect all four dependency fields:

1. `dependencies`
2. `devDependencies`
3. `optionalDependencies`
4. `peerDependencies`

They also inspect `overrides` entries in `pnpm-workspace.yaml` that use `catalog:` or `catalog:<name>` version references.

The `remove` command only selects candidates from the first three fields, so it cannot remove a declaration that exists only in `peerDependencies`. Peer declarations still count as references when deciding whether a catalog entry remains in use.

## Root and Child Projects

The `package.json` resolved from the working directory is treated as the current project and scanned together with discovered workspace projects. It is not necessarily the root manifest beside `pnpm-workspace.yaml`: running from a child project does not automatically add the workspace root manifest. Run from the workspace root, or point `--cwd` there, to scan both the root and child projects.

During `remove`:

- the current project uses the package manager's workspace-root option, so set the working directory to the workspace root when removing monorepo dependencies;
- child projects are filtered by package name;
- a dependency declared by one project is selected automatically;
- a dependency declared by multiple projects requires an interactive selection before any changes begin.

::: warning Package names
Removing a dependency from a child project relies on its `package.json#name` for package-manager filtering. Give every workspace package a valid, unique name.
:::
