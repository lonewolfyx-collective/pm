# Troubleshooting

## pnpm-workspace.yaml Cannot Be Found

`catalog` commands must find `pnpm-workspace.yaml` by searching upward from the working directory. Check the current path and file location:

```bash
pwd
ls pnpm-workspace.yaml
```

If the file belongs to another directory, change directories or pass it explicitly:

```bash
catalog -u --cwd /path/to/workspace
```

## A Dependency Cannot Be Moved or Removed

- `catalog move` scans all four dependency fields.
- `remove` only selects production, development, and optional dependencies.
- Verify that the package name exactly matches `package.json`.
- Verify that `pnpm-workspace.yaml#packages` includes the child project and that no `!` rule excludes it.

## run, dev, or build Selects the Wrong Project

These commands resolve `package.json` from the working directory and execute scripts in that directory. Check the current directory or specify the target project with `--cwd`:

```bash
run --cwd ./apps/web
dev --cwd ./apps/web
```

Relative paths are resolved from the terminal's current directory.

## run Reports No Scripts or No Matches

- Missing or empty `scripts` in `package.json` produce a warning and end the command.
- `run <keyword>` produces an error when nothing matches; use `run` without a keyword to list all scripts.
- Check that `--cwd` points to the target project and that scripts are defined in its `package.json#scripts`.

## The Lockfile Did Not Change After a Catalog Command

Catalog management commands do not install dependencies automatically. Review the edits, then run:

```bash
git diff -- package.json pnpm-workspace.yaml
pnpm install
```

`remove` is the exception: it runs an install only when catalog cleanup actually changes workspace YAML.

## Merging Catalogs Reports a Version Conflict

When `catalog rename` merges into an existing target, duplicate dependencies must use exactly the same version string. Decide which version to keep, make the two catalogs agree, and run the command again.

## clearn Did Not Remove a Lockfile

Lockfiles are removed only when `--lockfile` is present and a package manager is detected. The workspace configuration file `pnpm-workspace.yaml` is always preserved.

## Is init Safe in an Existing Project?

Bare `init` is not safe for an existing project: when it finds `package.json`, it clears everything except `.git`. Template mode (`init <name>`) prompts first, but confirmation still clears the current working directory. Use an empty directory or commit and back up your work first.

## Report an Issue

Open a [GitHub issue](https://github.com/lonewolfyx-collective/pm/issues) and include:

- the `@lonewolfyx/pm` version;
- Node.js and package-manager versions;
- the command and working directory;
- minimal relevant sections of `package.json` and `pnpm-workspace.yaml`;
- the complete error output and whether the issue is reproducible.
