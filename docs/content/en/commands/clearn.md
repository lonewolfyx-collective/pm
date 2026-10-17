# clearn: Clean Generated Files

`clearn` recursively finds and immediately deletes common dependency directories, build output, and caches.

## Usage

```bash
clearn
clearn --cwd ./apps/web
clearn --lockfile
```

::: danger Deletion has no confirmation step
Matched targets are deleted immediately. Verify that `--cwd` points to the intended project and commit or back up any generated output you still need.
:::

## Default Targets

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

The search includes dot directories but skips `.git` and symbolic links. Once a target directory matches, its children are not traversed, preventing duplicate deletion work.

## Remove Lockfiles

With `--lockfile`, the tool also looks for lockfiles recognized for the detected package manager:

```bash
clearn --lockfile
```

`pnpm-workspace.yaml` is workspace configuration and is never removed as a lockfile. If the package manager cannot be detected, the command warns and preserves lockfiles while still cleaning other targets.

## Output

After completion, the command prints the number of deleted targets and their paths. If no targets match, it prints `No targets found.` without failing.
