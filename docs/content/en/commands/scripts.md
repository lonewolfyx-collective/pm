# dev / build: Run Scripts

`dev` and `build` fuzzy-match script names in `package.json#scripts`, then run the selected script through the detected package manager.

## Usage

```bash
dev
build
```

Given this manifest:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:docs": "vitepress dev docs",
    "build": "tsdown",
    "build:docs": "vitepress build docs"
  }
}
```

- `dev` matches `dev` and `dev:docs`, then opens a selector.
- `build` matches `build` and `build:docs`, then opens a selector.
- A single match runs automatically.
- No matches produce an error.
- Cancelling the selector produces a non-zero exit code.

The selector shows both the script name and its command. Once selected, the tool runs the equivalent of `<package-manager> run <script>`.

## Working-directory Limitation

The current implementation resolves `package.json` from the terminal's current directory while the child process uses the directory supplied through `--cwd`. If those directories differ, a script can be selected from project A but executed in project B.

Use:

```bash
cd ./apps/web
dev
```

Avoid:

```bash
dev --cwd ./apps/web
```
