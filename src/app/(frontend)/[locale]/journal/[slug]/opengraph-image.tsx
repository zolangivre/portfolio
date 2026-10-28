import { getDictionary } from '@/lib/i18n/dictionary'
import { defaultLocale, locales, type Locale } from '@/lib/locale'
import { getMediaUrl } from '@/lib/media'
import { loadImageForOg, OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from '@/lib/og'
import { getGlobalSettings, getJournalEntry } from '@/lib/queries'

// Rendered on first request, then cached: a card built while the media host
// was down (text-only fallback) is rebuilt within a day, like the pages.
export const revalidate = 86400

type Params = { locale: string; slug: string }

function resolveLocale(locale: string): Locale {
  return locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale
}

/** See the project card: the alt text is the entry's own title. */
export async function generateImageMetadata({ params }: { params: Params }) {
  const locale = resolveLocale(params.locale)
  const entry = await getJournalEntry(params.slug, locale)

  return [
    {
      alt: entry?.meta?.title || entry?.title || getDictionary(locale).journal.title,
      contentType: OG_CONTENT_TYPE,
      id: 'card',
      size: OG_SIZE,
    },
  ]
}

export default async function OpengraphImage({ params }: { params: Promise<Params> }) {
  const { locale: rawLocale, slug } = await params
  const locale = resolveLocale(rawLocale)
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
  // The journal is about the pictures: the SEO tab's image, or the cover.
  const photo = await loadImageForOg(
    getMediaUrl(entry?.meta?.image) ?? getMediaUrl(entry?.coverImage),
    OG_SIZE.width,
  )

  return renderOgImage({
    accentKey: settings?.theme?.primaryColor,
    eyebrow: category ?? dictionary.journal.title,
    meta: [date, entry?.location],
    name: settings?.name,
    photo,
    profession: settings?.profession,
    title: entry?.title ?? dictionary.journal.title,
  })
}
