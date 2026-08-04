import { getJournalEntry } from '@/lib/queries'
import { defaultLocale, locales, type Locale } from '@/lib/locale'
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from '@/lib/og'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'Journal entry preview'

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: rawLocale, slug } = await params
  const locale: Locale = locales.includes(rawLocale as Locale)
    ? (rawLocale as Locale)
    : defaultLocale
  const entry = await getJournalEntry(slug, locale)

  return renderOgImage({
    eyebrow: typeof entry?.category === 'object' ? entry?.category?.name : null,
    locale,
    title: entry?.title ?? 'Journal',
  })
}
