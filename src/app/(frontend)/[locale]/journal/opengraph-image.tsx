import { getDictionary } from '@/lib/i18n/dictionary'
import { defaultLocale, locales, type Locale } from '@/lib/locale'
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from '@/lib/og'
import { getGlobalSettings, getJournalEntries, getSectionsContent } from '@/lib/queries'
import { resolveSectionCopy } from '@/lib/sectionCopy'

// Rendered on first request, then cached: a card built while the media host
// was down (text-only fallback) is rebuilt within a day, like the pages.
export const revalidate = 86400

/** The alt text is the section's title, in the page's language. */
export async function generateImageMetadata({ params }: { params: { locale: string } }) {
  const locale: Locale = locales.includes(params.locale as Locale)
    ? (params.locale as Locale)
    : defaultLocale
  const dictionary = getDictionary(locale)
  const sectionsContent = await getSectionsContent(locale)

  return [
    {
      alt: resolveSectionCopy(sectionsContent?.journal, dictionary.journal).title,
      contentType: OG_CONTENT_TYPE,
      id: 'card',
      size: OG_SIZE,
    },
  ]
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
