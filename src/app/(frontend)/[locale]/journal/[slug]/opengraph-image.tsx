import { getDictionary } from '@/lib/i18n/dictionary'
import { defaultLocale, locales, type Locale } from '@/lib/locale'
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from '@/lib/og'
import { getGlobalSettings, getJournalEntries, getJournalEntry } from '@/lib/queries'

export const alt = 'Journal'
export const contentType = OG_CONTENT_TYPE
export const size = OG_SIZE

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = []

  for (const locale of locales) {
    for (const entry of await getJournalEntries(locale)) {
      params.push({ locale, slug: entry.slug })
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

  const [settings, entry] = await Promise.all([
    getGlobalSettings(locale),
    getJournalEntry(slug, locale),
  ])

  const category =
    entry && typeof entry.category === 'object' && entry.category ? entry.category.name : null
  const date = entry?.date
    ? new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(entry.date))
    : null

  return renderOgImage({
    accentKey: settings?.theme?.primaryColor,
    eyebrow: category ?? dictionary.journal.title,
    meta: [date, entry?.location],
    name: settings?.name,
    profession: settings?.profession,
    title: entry?.title ?? dictionary.journal.title,
  })
}
