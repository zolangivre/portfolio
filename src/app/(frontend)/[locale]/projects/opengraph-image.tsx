import { getDictionary } from '@/lib/i18n/dictionary'
import { defaultLocale, locales, type Locale } from '@/lib/locale'
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from '@/lib/og'
import { getAllProjects, getGlobalSettings } from '@/lib/queries'

export const alt = 'Projects'
export const contentType = OG_CONTENT_TYPE
export const size = OG_SIZE

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale: Locale = locales.includes(rawLocale as Locale)
    ? (rawLocale as Locale)
    : defaultLocale
  const dictionary = getDictionary(locale)

  const [settings, projects] = await Promise.all([getGlobalSettings(locale), getAllProjects(locale)])

  return renderOgImage({
    accentKey: settings?.theme?.primaryColor,
    eyebrow: dictionary.projects.archiveEyebrow,
    meta: [`${projects.length} ${dictionary.projects.countSuffix}`],
    name: settings?.name,
    profession: settings?.profession,
    title: dictionary.projects.archiveTitle,
  })
}
