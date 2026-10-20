import { existsSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { cancel, isCancel, log, outro, select, spinner, text } from '@clack/prompts'
import { cyan } from 'ansis'
import { downloadTemplate } from 'giget'
import { runCommand } from '@/run.ts'
import { fetchTemplates } from '@/template.ts'
import { clearDirectory } from '@/utils.ts'

runCommand('create', async (config, _) => {
  // step 1:
  const templatesSpinner = spinner()
  templatesSpinner.start('Loading available templates')
  const availableTemplates = await fetchTemplates()
  templatesSpinner.stop('Templates loaded')

  // step 2:
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

  // step 3:
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

  const templateDownloadPath = resolve(config.cwd, dir)
  log.step(`Creating project in ${cyan((basename(templateDownloadPath)))}`)

  // step 4:
  const shouldVerify = existsSync(templateDownloadPath)
  if (shouldVerify) {
    await clearDirectory(templateDownloadPath)
  }

  // step 5: download template
  const downloadSpinner = spinner()
  downloadSpinner.start(`Downloading ${cyan(templateName)} template`)
  await downloadTemplate(template.tar, {
    dir: resolve(config.cwd, dir),
    force: true,
  })
  downloadSpinner.stop(`Downloaded ${cyan(template.name)} template`)

  outro('✨ Happy building!')
})
