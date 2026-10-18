---
layout: home

hero:
  name: '@lonewolfyx/pm'
  text: A friendlier package-management CLI
  tagline: Install and remove dependencies, maintain pnpm catalogs, run project scripts, and initialize or clean workspaces.
  image:
    src: /hero-terminal.svg
    alt: pm command-line workflow illustration
    width: 520
    height: 400
    fetchpriority: high
  actions:
    - theme: brand
      text: Get Started
      link: /en/guide/getting-started
    - theme: alt
      text: CLI Cheat Sheet
      link: /en/reference/cli

features:
  - title: Package-manager aware
    details: Detects the package manager used by the current project and translates ni, remove, dev, and build into the appropriate commands.
  - title: pnpm Catalog workflows
    details: Classify, move, rename, merge, remove, and clean catalog entries while keeping package.json references aligned.
  - title: Monorepo friendly
    details: Discovers workspace projects from pnpm-workspace.yaml and supports cross-package dependency removal and package initialization.
  - title: Interactive by default
    details: Presents clear terminal choices when scripts, projects, or catalog destinations are ambiguous.
---

## Commands

| Command | Purpose |
| --- | --- |
| [`ni`](/en/commands/ni) | Install project dependencies or add production, development, optional, and peer dependencies |
| [`remove`](/en/commands/remove) | Remove dependencies from one or more projects and clean unreferenced catalog entries |
| [`catalog`](/en/commands/catalog) | Move, rename, remove, or clean pnpm catalogs |
| [`dev`](/en/commands/scripts) | Fuzzy-find and run a script whose name matches `dev` |
| [`build`](/en/commands/scripts) | Fuzzy-find and run a script whose name matches `build` |
| [`clearn`](/en/commands/clearn) | Recursively delete dependency directories, build output, and caches |
| [`init`](/en/commands/init) | Initialize package configuration, project templates, workspace packages, or GitHub workflows |

::: tip Command spelling
The published command is named `clearn`, including the letter `r`. Enter it exactly as shown.
:::
