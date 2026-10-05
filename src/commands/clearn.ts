import { readdir, rm } from 'node:fs/promises'
import { join, relative, resolve, sep } from 'node:path'
import { log } from '@clack/prompts'
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
  const directories = [cwd]
  const targets: string[] = []

  while (directories.length) {
    const directory = directories.pop()!
    const entries = await readdir(directory, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.name === '.git' || entry.isSymbolicLink()) {
        continue
      }

      const path = join(directory, entry.name)
      const projectPath = relative(cwd, path).split(sep).join('/')
      const ignored = ignoredDirectories.some(pattern => projectPath === pattern || projectPath.endsWith(`/${pattern}`))

      if (entry.isDirectory()) {
        if (ignored) {
          targets.push(path)
        }
        else {
          directories.push(path)
        }
      }
      else if (entry.isFile() && (entry.name === '.tern-port' || lockFiles.has(entry.name))) {
        targets.push(path)
      }
    }
  }

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
