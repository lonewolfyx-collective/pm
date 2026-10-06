import { rm } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { log } from '@clack/prompts'
import { glob } from 'glob'
import { LOCKS } from 'package-manager-detector'
import { lock } from '../args/clearn.ts'
import { runCommand } from '../run.ts'

const ignoredDirectories = [
  'node_modules',
  'dist',
  '.nuxt',
  '.next',
  '.output',
  'jspm_packages',
  'web_modules',
  '.cache',
  '.parcel-cache',
  'out',
  '.vuepress/dist',
  '.temp',
  '.svelte-kit',
  '.docusaurus',
  '.serverless',
  '.fusebox',
  '.dynamodb',
  '.firebase',
  '.tern-port',
  '.turbo',
  '.build',
  'build',
  'Carthage',
]

runCommand('clearn', lock, async (config, ctx) => {
  const cwd = resolve(config.cwd)
  const agent = config.detect?.agent
  const manager = agent === 'pnpm-rush' ? 'pnpm' : agent?.split('@')[0]
  const lockFiles = new Set(ctx.args.lock
    ? Object.entries(LOCKS)
      // LOCKS also contains workspace configuration files used for detection.
        .filter(([file, name]) => name === manager && !file.endsWith('-workspace.yaml'))
        .map(([file]) => file)
    : [])
  const matches = await glob([...ignoredDirectories, ...lockFiles].map(pattern => `**/${pattern}`), {
    cwd,
    dot: true,
    nocase: false,
    follow: false,
    withFileTypes: true,
    ignore: {
      ignored: path => path.name === '.git' || path.isSymbolicLink(),
      childrenIgnored: path => path.fullpath() !== cwd && (
        path.name === '.git' || path.isSymbolicLink() || ignoredDirectories.includes(path.name)
      ),
    },
  })
  const targets = matches
    .filter(path => path.isDirectory()
      ? ignoredDirectories.includes(path.name)
      : path.isFile() && (path.name === '.tern-port' || lockFiles.has(path.name)))
    .map(path => path.fullpath())

  if (ctx.args.lock && !manager) {
    log.warn('Could not detect the package manager; lockfiles were preserved.')
  }

  if (!targets.length) {
    log.info('Nothing to remove.')
    return
  }

  for (const path of targets.sort()) {
    await rm(path, { recursive: true, force: true })
    log.success(`Removed ${relative(cwd, path)}`)
  }
})
