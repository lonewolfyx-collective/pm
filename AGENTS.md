# Repository Collaboration Guidelines

This file applies to the entire repository. All AI agents working in this repository must follow these requirements.

## Project Conventions

- The project uses TypeScript, ES Modules, and pnpm. Use the package manager version specified by `packageManager` in `package.json`.
- CLI source code lives in `src/`, command entry points live in `bin/`, and the build configuration is in `tsdown.config.ts`.
- Keep changes focused on the current task, follow the existing code style, and avoid unrelated refactoring.
- Run `pnpm lint` and `pnpm build` for code changes. Check content and formatting for documentation-only changes.
- Do not overwrite or revert the user's existing changes. Keep `pnpm-lock.yaml` in sync when changing dependencies.

## Coding Approach: Ablation Mode

**All coding must follow ablation mode: aim for the smallest implementation that satisfies the current requirements and preserves necessary behavior. Evaluate the necessity of each addition, and do not introduce unused code or unnecessary abstractions.**

- Start with the concrete problem and actual call paths. Prefer direct implementations; every new function, module, type, configuration option, or dependency must serve a current requirement.
- Do not introduce generic frameworks, factories, strategy layers, plugin mechanisms, or extension interfaces for hypothetical future needs.
- Do not add abstractions merely to wrap a single call, forward arguments, or create formal layers. Extract shared logic only when existing callers need reuse or when it clearly reduces current complexity.
- Evaluate each addition by asking whether the current requirements would still be met correctly without that code or layer. If so, omit it when doing so preserves readability and existing behavior.
- Remove unused code, redundant branches, duplicated state, and unnecessary configuration introduced by the change. Limit cleanup of existing code to the current task's scope.
- Preserve necessary input validation, error handling, type constraints, and confirmed compatibility requirements when simplifying code. Verify behavior with checks relevant to the change.

## PRs and Commit Messages: Conventional Commits Is Mandatory

**When creating or updating a PR, fully comply with the [official Conventional Commits 1.0.0 specification](https://www.conventionalcommits.org/en/v1.0.0/). This requirement applies to the PR title, every commit message created for the current work, and the final squash commit message. Do not create a PR, including a draft PR, with a noncompliant title or associated commit messages.**

The official specification governs commit messages. This repository additionally applies its header format to PR titles. The PR body explains the change and does not need to follow the commit message format as a whole. The guidance below does not replace the full specification; all omitted details remain subject to the official requirements.

### Title and Commit Format

```text
<type>[optional scope][optional !]: <description>

[optional body]

[optional footer(s)]
```

- `type` and a short, nonempty `description` are required. The separator must be an ASCII colon followed by a space: `: `.
- Use `feat` for new features and `fix` for bug fixes.
- Other types are allowed, including `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `style`, and `revert`. The official specification does not define a closed list of types.
- Use lowercase `type` values consistently in this repository. This is a repository convention; the official specification does not require lowercase types.
- `scope` is optional. When present, it must be a noun describing a section of the codebase, enclosed in parentheses, such as `fix(config): ...`.
- The commit body is optional and must begin one blank line after the header. Separate footers from the body with a blank line as well.
- Use `Token: value` or `Token #value` for footers. Replace spaces in footer tokens with `-`, except for `BREAKING CHANGE`. Values may span lines and end when the next valid token and separator pair appears.

### Breaking Changes

- Any commit type may include a breaking change. Mark it explicitly with `!` or a breaking change footer.
- Place `!` immediately before the colon, such as `feat(cli)!: remove the legacy install command`. When using only `!`, the header description must explain the breaking change.
- Use `BREAKING CHANGE: <description>` for the footer, with the marker in uppercase. The official specification also accepts the equivalent `BREAKING-CHANGE: <description>`.
- A PR containing breaking changes must include `!` in its title and describe the impact and migration steps in its body. This is an additional repository requirement for PRs.
- Preserve breaking change markers and explanations in the final squash commit message.

### Examples

Valid PR titles or commit headers:

```text
feat(cli): add interactive package selection
fix(config): handle missing workspace configuration
docs: add repository collaboration guidelines
refactor(commands): extract shared command execution
feat(cli)!: remove the legacy install command
```

A commit message with a body and footers:

```text
feat(cli)!: remove the legacy install command

Use the ni command as the single entry point for package installation.

BREAKING CHANGE: replace invocations of the legacy install command with ni.
Refs: #123
```

### Checks Before Creating or Updating a PR

- Before creating a PR, check its title and every commit message created for the current work. Confirm that their format, type, and description match the actual changes.
- Do not use titles such as `update code`, `fix bug`, or `WIP` without a type prefix. Set draft status through the platform instead of adding a prefix that breaks the title format.
- Explain the concrete problem, resulting behavior, and validation results in the PR body. Include related issues and migration steps when applicable.
- Update the title and body whenever the PR scope changes. Split independent changes of different kinds into separate commits or PRs where practical.
- Correct noncompliant titles or commit messages before creating or updating a PR. Do not bypass existing commit validation hooks. Do not rewrite other people's commits or force-push shared branches without authorization when correcting history.
- Before merging, confirm that the final commit message still complies with the full specification. Squash merging does not waive the checks required when creating the PR.
