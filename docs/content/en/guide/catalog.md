# pnpm Catalogs

[pnpm catalogs](https://pnpm.io/catalogs) keep shared versions in `pnpm-workspace.yaml` while project manifests store references:

```yaml
packages:
  - packages/*

catalog:
  typescript: ^6.0.0

catalogs:
  build:
    tsdown: ^0.23.0
    vite: ^5.4.0
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

## Default and Named Catalogs

- `catalog` is the default catalog and uses the `catalog:` reference. The tool also accepts `catalog:default`.
- `catalogs.<name>` defines a named catalog and uses `catalog:<name>`.
- Every catalog value must be a version string.

## Built-in Classification

`ni --catalog` and `catalog move` share the same classification rules. The current automatic rules are:

| Destination | Automatically matched packages |
| --- | --- |
| `lint` | `eslint`, `@eslint/*`, `@antfu/eslint-config`, `oxlint`, `oxfmt` |
| `build` | `tsdown`, `vite` |

The first matching rule wins. Registry package names may include versions, and npm aliases are classified after removing their alias prefix. Git URLs, file paths, and other non-registry sources are not classified automatically.

The selector also provides `test`, `script`, `frontend`, `backend`, `types`, `inlined`, `prod`, `dev`, and `config`. These are available destinations but do not classify packages on their own.

## Recommended Workflow

Assign catalogs while adding new dependencies:

```bash
ni --catalog -D eslint tsdown vite vitest
```

Organize existing dependencies:

```bash
catalog move eslint tsdown vite
```

Synchronize the lockfile after reviewing the changes:

```bash
pnpm install
```

::: info Why installation is manual
`catalog move`, `catalog rename`, `catalog remove`, and `catalog -u` edit workspace YAML and project manifests without running an install. This lets you review the changes before updating `pnpm-lock.yaml`.
:::

## Version Selection

When moving a dependency, the destination version is chosen in this order:

1. the version already present in the destination catalog;
2. the current project's declaration, resolving a catalog reference when necessary;
3. the first workspace project that declares the dependency.

All matching projects then use the same destination reference. If projects previously used different versions, moving the dependency can therefore unify their effective versions. Review `package.json` and `pnpm-workspace.yaml` before installing.
