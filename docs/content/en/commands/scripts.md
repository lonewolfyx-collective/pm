# run / dev / build / lint / fix: Run Scripts

`run`, `dev`, `build`, `lint`, and `fix` find scripts in `package.json#scripts`, then run the selected script through the detected package manager. Keywords use fuzzy matching.

## Usage

```bash
run
run docs
dev
build
lint
fix
```

Given this manifest:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:docs": "vitepress dev docs",
    "build": "tsdown",
    "build:docs": "vitepress build docs",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

- `run` opens a selector with all scripts, even when only one script exists.
- `run docs` matches `dev:docs` and `build:docs`, then opens a selector.
- `dev` matches `dev` and `dev:docs`, then opens a selector.
- `build` matches `build` and `build:docs`, then opens a selector.
- `lint` matches `lint` and `lint:fix`, then opens a selector.
- `fix` matches only `lint:fix` and runs it automatically.
- With a keyword or with `dev`, `build`, `lint`, and `fix`, a single match runs automatically.
- Missing or empty `scripts` produce a warning and end the command.
- A keyword with no matches produces an error.
- Cancelling the selector produces a non-zero exit code.

The selector shows both the script name and its command. Once selected, the tool runs the equivalent of `<package-manager> run <script>`.

## Working Directory

By default, `package.json` is resolved from the terminal's current directory. With `--cwd`, scripts are read and executed using the specified directory:

```bash
run --cwd ./apps/web
dev --cwd ./apps/web
```
