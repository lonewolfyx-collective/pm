import type { ResolveConfig, TemplateData } from '@/types.ts'
import { existsSync } from 'node:fs'
import { basename, relative, resolve } from 'node:path'
import { cancel, isCancel, log, spinner, text } from '@clack/prompts'
import { cyan, green } from 'ansis'
import { downloadTemplate } from 'giget'
import { glob } from 'glob'
import { replaceInFile } from 'replace-in-file'
import { x } from 'tinyexec'
import { clearDirectory } from '@/utils.ts'

export class ProjectBuilder {
  private template?: {
    name: string
    data: TemplateData
  }

  private directory?: string

  private description?: string

  constructor(private readonly config: ResolveConfig) {}

  withTemplate(name: string, data: TemplateData): this {
    this.template = { name, data }
    return this
  }

  withDirectory(directory: string): this {
    this.directory = resolve(this.config.cwd, directory)
    return this
  }

  async withPackageDescription(): Promise<this> {
    const description = await text({
      message: 'Description',
      placeholder: '',
      defaultValue: '',
    }) as string

    if (isCancel(description)) {
      cancel('Operation cancelled.')
      process.exit(1)
    }

    this.description = description
    return this
  }

  async withGit(git: boolean): Promise<this> {
    if (git) {
      await x('git', ['init'], {
        nodeOptions: {
          stdio: ['ignore', 'ignore', 'inherit'],
          cwd: this.directory,
        },
      })
      log.step('Git initialized.')
    }
    return this
  }

  async replaceTemplateKeywords(): Promise<this> {
    const resolveConfigPath = await glob(`**/{package.json,README.md}`, {
      cwd: this.directory,
      ignore: 'node_modules/**',
    })

    const projectName = basename(this.directory!)
    const results = await replaceInFile({
      files: resolveConfigPath,
      from: [
        /pkg-placeholder/g,
        /_description_/g,
      ],
      to: [
        projectName,
        this.description || '',
      ],
      countMatches: true,
      glob: {
        cwd: this.directory,
        absolute: true,
      },
    })

    for (const result of results) {
      if (!result.hasChanged)
        continue
      log.success(`${green(relative(this.directory!, result.file))} was replaced in ${green(result.numReplacements)} place(s)`)
    }

    return this
  }

  async initialProject(): Promise<void> {
    if (!this.template) {
      throw new Error('A template is required to create a project.')
    }

    const { name, data } = this.template
    const directory = this.directory!
    log.step(`Creating project in ${cyan(basename(directory))}`)

    if (existsSync(directory)) {
      await clearDirectory(directory)
    }

    const downloadSpinner = spinner()
    downloadSpinner.start(`Downloading ${cyan(name)} template`)
    await downloadTemplate(data.tar, {
      dir: directory,
      force: true,
    })
    downloadSpinner.stop(`Downloaded ${cyan(data.name)} template`)
  }
}
