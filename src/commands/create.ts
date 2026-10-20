import { cancel, isCancel, outro, text } from '@clack/prompts'
import { ProjectBuilder } from '@/create/index.ts'
import { runCommand } from '@/run.ts'
import { choicesTemplate } from '@/template.ts'

runCommand('create', async (config) => {
  const { templates: availableTemplates, name: templateName } = await choicesTemplate()

  if (isCancel(templateName)) {
    cancel('Operation cancelled.')
    process.exit(1)
  }

  const template = availableTemplates[templateName]!

  const defaultDir = template.defaultDir
  const dir = await text({
    message: 'Where would you like to create your project?',
    placeholder: `./${defaultDir}`,
    defaultValue: defaultDir,
  })

  if (isCancel(dir)) {
    cancel('Operation cancelled.')
    process.exit(1)
  }

  await new ProjectBuilder(config)
    .withTemplate(templateName, template)
    .withDirectory(dir)
    .initialProject()

  outro('✨ Happy building!')
})
