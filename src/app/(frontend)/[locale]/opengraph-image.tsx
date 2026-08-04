import { getHero } from '@/lib/queries'
import { defaultLocale, locales, type Locale } from '@/lib/locale'
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from '@/lib/og'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'Portfolio'

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = locales.includes(rawLocale as Locale)
    ? (rawLocale as Locale)
    : defaultLocale
  const hero = await getHero(locale)

  return renderOgImage({
    eyebrow: hero?.eyebrow ?? null,
    locale,
    title: hero?.title ?? 'Portfolio',
  })
}
