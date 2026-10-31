import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { Baloo_2, Bagel_Fat_One, Inter } from 'next/font/google'
import React from 'react'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { IndexRail } from '@/components/layout/IndexRail'
import { LivePreviewRefresh } from '@/components/preview/LivePreviewRefresh'
import { PreviewBanner } from '@/components/preview/PreviewBanner'
import { JsonLd } from '@/components/seo/JsonLd'
import { MotionProvider } from '@/components/providers/MotionProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { AmbientBackground } from '@/components/ui/AmbientBackground'
import { CardTilt } from '@/components/ui/CardTilt'
import { CursorEffects } from '@/components/ui/CursorEffects'
import { getDictionary } from '@/lib/i18n/dictionary'
import { defaultLocale, locales, type Locale } from '@/lib/locale'
import { getMediaUrl } from '@/lib/media'
import { isPreview } from '@/lib/preview'
import { getFooter, getGlobalSettings, getNavigation, getSectionsVisibility } from '@/lib/queries'
import { OG_LOCALES, personJsonLd, websiteJsonLd } from '@/lib/seo'
import { buildThemeStyle } from '@/lib/theme/palette'

import '../../globals.css'
import './styles.css'

// Payload's afterChange hooks revalidate by tag the moment content is saved,
// so this interval is only a safety net for edits that bypass them (scripts,
// `payload migrate`). It must stay a literal — Next requires the value to be
// statically analyzable — and mirrors FALLBACK_REVALIDATE in `@/lib/cache`.
export const revalidate = 86400

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

const baloo2 = Baloo_2({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-baloo-2',
})

const inter = Inter({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-inter',
})

const bagelFatOne = Bagel_Fat_One({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-bagel-fat-one',
  weight: '400',
})

type LayoutParams = { locale: string }

// Tints the mobile browser chrome to the page. Mirrors --bg in globals.css;
// it follows the system scheme, since a meta tag can't see the class the
// theme toggle sets.
export const viewport: Viewport = {
  themeColor: [
    { color: '#f4f5f2', media: '(prefers-color-scheme: light)' },
    { color: '#0a0d11', media: '(prefers-color-scheme: dark)' },
  ],
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

function resolveLocale(locale: string): Locale {
  return locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale
}

export async function generateMetadata({
  params,
}: {
  params: Promise<LayoutParams>
}): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale = resolveLocale(rawLocale)
  const settings = await getGlobalSettings(locale)
  const title = settings?.seo?.defaultTitle ?? 'Developer Portfolio'
  const description =
    settings?.seo?.defaultDescription ??
    'Professional developer portfolio powered by Payload CMS and Next.js.'
  const imageUrl = getMediaUrl(settings?.seo?.defaultImage)
  const images = imageUrl ? [{ url: imageUrl }] : undefined

  return {
    metadataBase: new URL(siteUrl),
    description,
    openGraph: {
      description,
      images,
      locale: OG_LOCALES[locale],
      siteName: title,
      title,
      type: 'website',
      url: `/${locale}`,
    },
    // No `images`: X falls back to og:image, the generated card, so the
    // homepage shares the same picture on X as everywhere else.
    twitter: {
      card: 'summary_large_image',
      description,
      title,
    },
    // Only the homepage keeps these: every other page sets its own through
    // `pageMetadata` (@/lib/seo), or it would inherit this canonical.
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ...Object.fromEntries(locales.map((entry) => [entry, `/${entry}`])),
        'x-default': '/fr',
      },
    },
    title: {
      default: title,
      template: `%s | ${title}`,
    },
  }
}

export default async function LocaleLayout(props: {
  children: React.ReactNode
  params: Promise<LayoutParams>
}) {
  const { children, params } = props
  const { locale: rawLocale } = await params

  if (!locales.includes(rawLocale as Locale)) {
    notFound()
  }

  const locale = rawLocale as Locale
  const dictionary = getDictionary(locale)

  const [navigation, footer, settings, sections, preview] = await Promise.all([
    getNavigation(locale),
    getFooter(locale),
    getGlobalSettings(locale),
    getSectionsVisibility(locale),
    isPreview(),
  ])

  const themeStyle = buildThemeStyle(settings?.theme?.primaryColor, settings?.theme?.accentColor)
  const photoUrl = getMediaUrl(settings?.photo)
  const backgroundPhotos = (settings?.theme?.backgroundPhotos ?? []).flatMap((row) => {
    const url = getMediaUrl(row.photo)

    return url ? [url] : []
  })
  const jsonLd = [
    personJsonLd({
      email: settings?.contactEmail,
      jobTitle: settings?.profession,
      locale,
      name: settings?.name,
      photoUrl,
      sameAs: (settings?.socialLinks ?? []).map((link) => link.url),
      siteUrl,
    }),
    websiteJsonLd({ locale, name: settings?.name, siteUrl }),
  ]

  return (
    <html
      className={`${baloo2.variable} ${inter.variable} ${bagelFatOne.variable}`}
      data-scroll-behavior="smooth"
      lang={locale}
      suppressHydrationWarning
    >
      <body>
        <style dangerouslySetInnerHTML={{ __html: themeStyle }} />
        {jsonLd.map((data) => (
          <JsonLd data={data} key={String(data['@type'])} />
        ))}
        <a className="skip-link" href="#main-content">
          {dictionary.nav.skipToContent}
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme={settings?.theme?.defaultTheme ?? 'system'}
          disableTransitionOnChange
          enableSystem
        >
          <MotionProvider>
            <AmbientBackground
              photos={backgroundPhotos}
              variant={settings?.theme?.backgroundStyle}
            />
            <CursorEffects effect={settings?.theme?.cursorEffect} />
            <CardTilt />
            <IndexRail
              dictionary={dictionary}
              locale={locale}
              navigation={navigation}
              sections={sections}
            />
            <div className="site-shell">
              <Header
                dictionary={dictionary}
                locale={locale}
                navigation={navigation}
                sections={sections}
                settings={settings}
              />
              <main id="main-content">{children}</main>
              <Footer dictionary={dictionary} footer={footer} locale={locale} />
            </div>
          </MotionProvider>
        </ThemeProvider>
        {preview ? (
          <>
            <LivePreviewRefresh />
            <PreviewBanner exitLabel={dictionary.preview.exit} label={dictionary.preview.banner} />
          </>
        ) : null}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
