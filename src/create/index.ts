import type { TemplateData } from '@/types.ts'
import { existsSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { log, spinner } from '@clack/prompts'
import { cyan } from 'ansis'
import { downloadTemplate } from 'giget'
import { clearDirectory } from '@/utils.ts'

export class ProjectBuilder {
  private template?: {
    name: string
    data: TemplateData
  }

  private directory?: string

  constructor(private readonly cwd: string) {}

  withTemplate(name: string, data: TemplateData): this {
    this.template = { name, data }
    return this
  }

  withDirectory(directory: string): this {
    this.directory = resolve(this.cwd, directory)
    return this
  }

  async build(): Promise<void> {
    if (!this.template) {
      throw new Error('A template is required to create a project.')
    }

    if (!this.directory) {
      throw new Error('A directory is required to create a project.')
    }

    const { name, data } = this.template
    const directory = this.directory
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
