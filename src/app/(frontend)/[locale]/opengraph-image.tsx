import { defaultLocale, locales, type Locale } from '@/lib/locale'
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from '@/lib/og'
import { getGlobalSettings, getHero } from '@/lib/queries'

// Rendered on first request, then cached: a card built while the media host
// was down (text-only fallback) is rebuilt within a day, like the pages.
export const revalidate = 86400

/** The alt text names the owner and their job, in the page's language. */
export async function generateImageMetadata({ params }: { params: { locale: string } }) {
  const locale: Locale = locales.includes(params.locale as Locale)
    ? (params.locale as Locale)
    : defaultLocale
  const settings = await getGlobalSettings(locale)

  return [
    {
      alt:
        [settings?.name, settings?.profession].filter(Boolean).join(' — ') ||
        settings?.seo?.defaultTitle ||
        'Portfolio',
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

  const [settings, hero] = await Promise.all([getGlobalSettings(locale), getHero(locale)])

  const highlights = (hero?.highlights ?? [])
    .map((highlight) => highlight.value)
    .filter((value) => value.trim().length > 0)
    .slice(0, 3)

  return renderOgImage({
    accentKey: settings?.theme?.primaryColor,
    eyebrow: hero?.eyebrow,
    meta: highlights,
    name: settings?.name,
    profession: settings?.profession,
    title: hero?.title ?? settings?.seo?.defaultTitle ?? 'Portfolio',
  })
}
