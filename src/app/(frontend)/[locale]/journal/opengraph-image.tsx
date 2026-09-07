import { getDictionary } from '@/lib/i18n/dictionary'
import { defaultLocale, locales, type Locale } from '@/lib/locale'
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from '@/lib/og'
import { getGlobalSettings, getJournalEntries, getSectionsContent } from '@/lib/queries'
import { resolveSectionCopy } from '@/lib/sectionCopy'

export const alt = 'Journal'
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

  const [settings, sectionsContent, entries] = await Promise.all([
    getGlobalSettings(locale),
    getSectionsContent(locale),
    getJournalEntries(locale),
  ])

  const content = resolveSectionCopy(sectionsContent?.journal, dictionary.journal)

  return renderOgImage({
    accentKey: settings?.theme?.primaryColor,
    eyebrow: content.eyebrow,
    meta: [`${entries.length} ${dictionary.journal.countSuffix}`],
    name: settings?.name,
    profession: settings?.profession,
    title: content.title,
  })
}
