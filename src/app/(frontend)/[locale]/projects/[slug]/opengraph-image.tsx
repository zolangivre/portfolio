import { getDictionary } from '@/lib/i18n/dictionary'
import { defaultLocale, locales, type Locale } from '@/lib/locale'
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from '@/lib/og'
import { getAllProjects, getGlobalSettings, getProject } from '@/lib/queries'

export const alt = 'Project'
export const contentType = OG_CONTENT_TYPE
export const size = OG_SIZE

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = []

  for (const locale of locales) {
    for (const project of await getAllProjects(locale)) {
      params.push({ locale, slug: project.slug })
    }
  }

  return params
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: rawLocale, slug } = await params
  const locale: Locale = locales.includes(rawLocale as Locale)
    ? (rawLocale as Locale)
    : defaultLocale
  const dictionary = getDictionary(locale)

  const [settings, project] = await Promise.all([getGlobalSettings(locale), getProject(slug, locale)])

  const category =
    project && typeof project.category === 'object' && project.category
      ? project.category.name
      : null
  const technologies = (project?.technologies ?? [])
    .map((technology) => (typeof technology === 'object' && technology ? technology.name : null))
    .filter((name): name is string => Boolean(name))
    .slice(0, 3)

  return renderOgImage({
    accentKey: settings?.theme?.primaryColor,
    eyebrow: category ?? dictionary.projects.title,
    meta: [project?.year ? String(project.year) : null, ...technologies],
    name: settings?.name,
    profession: settings?.profession,
    title: project?.title ?? dictionary.projects.title,
  })
}
