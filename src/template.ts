import type { GithubTemplateData, ResolveTemplate, TemplateData } from '@/types.ts'
import { select, spinner } from '@clack/prompts'
import { ofetch } from 'ofetch'

export const TEMPLATES_API_URL = 'https://api.github.com/repos/lonewolfyx-template/starter/contents/templates?ref=main'

export async function fetchTemplates(): Promise<
  Record<string, TemplateData>
> {
  const templates = Object.create(null)

  const files = await ofetch<GithubTemplateData[]>(TEMPLATES_API_URL)

  if (!Array.isArray(files)) {
    return templates
  }

  await Promise.all(files.map(async (file) => {
    if (!file?.download_url || typeof file.name !== 'string' || !file.name.endsWith('.json')) {
      return
    }

    const templateName = file.name.replace('.json', '')
    templates[templateName] = JSON.parse(await ofetch(file.download_url))
  }))

  return templates
}

export async function choicesTemplate(): Promise<ResolveTemplate> {
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
  }) as string

  return {
    templates: availableTemplates,
    name: templateName,
  }
}
