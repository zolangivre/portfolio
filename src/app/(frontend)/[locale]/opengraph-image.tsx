import { defaultLocale, locales, type Locale } from '@/lib/locale'
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from '@/lib/og'
import { getGlobalSettings, getHero } from '@/lib/queries'

export const alt = 'Portfolio'
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
