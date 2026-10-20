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

The command asks you to choose a template, choose a target directory, and enter a description, then downloads the template. The target directory defaults to the positional project name and can be changed at the prompt. Relative paths are resolved from the working directory, which can be set with `--cwd`.

After generation, `pkg-placeholder` in the target directory's `package.json` and `README.md` files is replaced with the last segment of the target directory, and `_description_` is replaced with the entered description. For example, choosing `apps/web` produces the name `web`; choosing `@scope/foo` produces `foo` without the `@scope`. To use a scoped package name, edit `package.json#name` after generation.

`--git` initializes Git in the target directory after downloading the template. Without it, the command does not run `git init`. This flow does not install dependencies automatically; enter the target directory afterwards and install them with the package manager required by the selected template.

::: danger Existing target directory contents are deleted
If the target directory already exists, the command deletes everything in it except `.git` before downloading the template, without another prompt or a check for `package.json`. Choose a new directory or back up the target directory first. An existing `package.json` in the working directory does not itself trigger cleanup, but selecting `.` as the target clears the working directory.
:::

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
| `<package>` | Default target directory for a template project, or workspace package name |
| `--monorepo` | Create a workspace package |
| `--github`, `--ci`, `--ci-cd`, `--cd` | Add GitHub CI/CD files |
| `--git` | Initialize Git while generating a template project |
| `-p`, `--dependencies` | Declared by the current version but does not yet change behavior |
| `-c`, `--cwd <dir>` | Set the working directory |
