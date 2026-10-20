import { cancel, isCancel, outro, select, spinner, text } from '@clack/prompts'
import { ProjectBuilder } from '@/create/index.ts'
import { runCommand } from '@/run.ts'
import { fetchTemplates } from '@/template.ts'

runCommand('create', async (config) => {
  const templatesSpinner = spinner()
  templatesSpinner.start('Loading available templates')
  const availableTemplates = await fetchTemplates()
  templatesSpinner.stop('Templates loaded')

  const templateName = await select({
    message: 'Which template would you like to use?',
    options: Object.entries(availableTemplates).map(([value, data]) => ({
      value,
      label: value,
      hint: data.description,
    })),
  })

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

  await new ProjectBuilder(config.cwd)
    .withTemplate(templateName, template)
    .withDirectory(dir)
    .build()

  outro('✨ Happy building!')
})
