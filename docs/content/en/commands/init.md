# init: Initialize Projects

`init` selects one of four mutually exclusive flows. Matching priority is:

1. `--github`
2. `--monorepo`
3. a positional project name
4. package-configuration initialization with no mode argument

If several modes are supplied, only the highest-priority mode runs.

## Initialize Package Configuration

```bash
init
```

This mode:

1. fetches GitHub's Node `.gitignore` template;
2. runs `pnpm init`;
3. installs the project's standard TypeScript, ESLint, Git-hook, and related development dependencies;
4. normalizes `package.json`;
5. generates `eslint.config.ts` and runs `pnpm lint:fix`.

::: danger Existing project contents are deleted
If the working directory already contains `package.json`, the current implementation deletes everything except `.git` and then initializes the package without another prompt. Run this mode only in an empty directory or a directory you intentionally want to rebuild.
:::

This flow requires network access to fetch `.gitignore` and install dependencies.

## Create a Project from a Template

```bash
init my-project
init my-project --git
```

The command asks you to choose a template and enter a description, then generates the project through its bundled project creator. `--git` also initializes Git.

If the current working directory contains `package.json`, the command asks before overwriting. Confirming clears the current directory except `.git`; cancelling leaves it unchanged.

## Create a Monorepo Package

```bash
init my-package --monorepo
init --monorepo
```

The tool reads `pnpm-workspace.yaml#packages` and lists available workspace directories. If none exist, it can create one. A custom directory is registered as `<folder>/*` in the workspace configuration.

When the package name is omitted, the prompt asks for one. The command then creates `<workspace>/<package>/package.json` with the built-in ESM library template. This mode creates only the directory and manifest; it does not generate source files or install dependencies.

::: info Custom-directory restrictions
The interactive value must be one directory name. `.`, `..`, forward slashes, and backslashes are rejected.
:::

## Add GitHub Workflows

```bash
init --github
```

The command reads the current Git repository's `origin`, downloads the `lonewolfyx-workflows/github-workflows` template, and writes it into `.github`. If template files conflict with existing files, select which ones may be replaced. Deselected files stay unchanged, and the temporary download directory is removed afterwards.

Run this mode from a Git repository with a valid `origin`, and commit or back up important `.github` changes first.

## Options

| Option | Description |
| --- | --- |
| `<package>` | Project or workspace package name |
| `--monorepo` | Create a workspace package |
| `--github`, `--ci`, `--ci-cd`, `--cd` | Add GitHub CI/CD files |
| `--git` | Initialize Git while generating a template project |
| `-p`, `--dependencies` | Declared by the current version but does not yet change behavior |
| `-c`, `--cwd <dir>` | Set the working directory |
