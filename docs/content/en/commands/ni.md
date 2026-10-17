# ni: Install Dependencies

`ni` invokes the package manager detected for the project. Without package names, it installs all project dependencies. With package names, it adds them.

## Usage

```text
ni [options] [package...]
```

```bash
ni
ni vue axios
ni -D typescript vite
ni -O sharp
ni --peer vue
```

In a pnpm project, these calls correspond to `pnpm install`, `pnpm add`, and add operations with `-D`, `-o`, or `--save-peer`.

## Options

| Option | Description |
| --- | --- |
| `-d`, `-D`, `--dev-dependencies` | Add development dependencies |
| `-o`, `-O`, `--optional-dependencies` | Add optional dependencies |
| `-p`, `--peer`, `--peer-dependencies` | Add peer dependencies |
| `--catalog` | Assign packages through rules and interactive catalog selection; pnpm only |
| `--catalog-name <name>` | Save the entire batch to one catalog; pnpm only |
| `-c`, `--cwd <dir>` | Set the working directory |

If multiple dependency-type options are present, the tool forwards all corresponding flags to the underlying package manager. Whether that combination is valid depends on the package manager; normally, select one dependency type.

## Automatic and Interactive Catalog Assignment

```bash
ni --catalog -D eslint tsdown vite vitest
```

The tool processes this example as follows:

1. `eslint` is assigned to `lint` by a rule.
2. `tsdown` and `vite` are assigned to `build` by a rule.
3. `vitest` has no matching rule, so the terminal asks for a catalog.
4. Each group is installed separately with pnpm's `--save-catalog --save-catalog-name <name>` options.

Unmatched packages can be divided among several catalogs. Custom interactive catalog names may contain only English letters and digits.

When the entire batch belongs to one catalog, skip the interactive flow:

```bash
ni --catalog-name test -D vitest @vitest/coverage-v8
```

## Constraints

- `--catalog` and `--catalog-name` are mutually exclusive.
- Both catalog options require at least one package name.
- Both catalog options require a project detected as pnpm.
- Duplicate package specifiers are removed before execution.
- Cancelling a catalog prompt stops the installation and sets a non-zero exit code.
