import type { initArgs } from '@/args/init.ts'
import type { CommandHandler } from '@/types.ts'
import { cancel, isCancel, outro, text } from '@clack/prompts'
import { green } from 'ansis'
import { ProjectBuilder } from '@/create'
import { choicesTemplate } from '@/template.ts'

export const createProject: CommandHandler<typeof initArgs> = async (config, ctx) => {
  const { templates: availableTemplates, name: templateName } = await choicesTemplate()

  if (isCancel(templateName)) {
    cancel('Operation cancelled.')
    process.exit(1)
  }

  const template = availableTemplates[templateName]!

  const defaultDir = ctx.args.package || template.defaultDir
  const dir = await text({
    message: 'Where would you like to create your project?',
    placeholder: `./${defaultDir}`,
    defaultValue: defaultDir,
  })

  if (isCancel(dir)) {
    cancel('Operation cancelled.')
    process.exit(1)
  }

  const step = new ProjectBuilder(config)
    .withTemplate(templateName, template)
    .withDirectory(dir)

  await step.withPackageDescription()
  await step.initialProject()
  await step.withGit(ctx.args.git)
  await step.replaceTemplateKeywords()

  outro(`🚀  Successfully created project ${green(ctx.args.package)}`)
}
