import { resolve } from 'node:path'
import { log, note, outro, progress, spinner } from '@clack/prompts'
import { cyan, red, yellow } from 'ansis'
import { glob } from 'glob'
import { LOCKS } from 'package-manager-detector'
import { rimraf } from 'rimraf'
import { lockfile } from '../args/lockfile.ts'
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

runCommand('clearn', lockfile, async (config, ctx) => {
  const cwd = resolve(config.cwd)
  const agent = config.detect?.agent
  const manager = agent === 'pnpm-rush' ? 'pnpm' : agent?.split('@')[0]
  const lockFiles = new Set(ctx.args.lockfile
    ? Object.entries(LOCKS)
      // LOCKS also contains workspace configuration files used for detection.
        .filter(([file, name]) => name === manager && !file.endsWith('-workspace.yaml'))
        .map(([file]) => file)
    : [])

  const s = spinner()
  s.start('Checking the "old stuff" in the project...')

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

  if (ctx.args.lockfile && !manager) {
    log.warn('Could not detect the package manager; lockfiles were preserved.')
  }

  s.stop(`Find ${red(targets.length)} cleanable targets (e.g., node_modules, etc.)`)

  if (targets.length > 0) {
    const prog = progress({
      indicator: 'timer',
      style: 'block',
      max: targets.length,
    })

    prog.start('Freeing up disk space...')

    for (const folder of targets) {
      prog.advance(1, `Delete: ${red(folder)}`)
      await rimraf(folder)
    }

    prog.stop('Clean up!')

    note(
      targets
        .map(f => `${yellow('-')} ${cyan(f.replace(config.cwd, ''))}`)
        .join('\n'),
      'Delete directory:',
    )

    outro(`🎉 Done.`)
  }
  else {
    outro('No targets found.')
  }
})
