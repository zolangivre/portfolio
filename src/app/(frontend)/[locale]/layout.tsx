import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Bagel_Fat_One, Fraunces, Inter } from 'next/font/google'
import Script from 'next/script'
import React from 'react'
import { Analytics } from '@vercel/analytics/next'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { MotionProvider } from '@/components/providers/MotionProvider'
import { PageTransition } from '@/components/providers/PageTransition'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { AmbientBackground } from '@/components/ui/AmbientBackground'
import { CursorEffects } from '@/components/ui/CursorEffects'
import { getDictionary } from '@/lib/i18n/dictionary'
import { defaultLocale, locales, type Locale } from '@/lib/locale'
import { getMediaUrl } from '@/lib/media'
import { getFooter, getGlobalSettings, getNavigation, getSectionsVisibility } from '@/lib/queries'
import { buildThemeStyle } from '@/lib/theme/palette'

import '../../globals.css'
import './styles.css'

export const revalidate = 60

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

const fraunces = Fraunces({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-fraunces',
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
      locale,
      siteName: title,
      title,
      type: 'website',
      url: `/${locale}`,
    },
    twitter: {
      card: 'summary_large_image',
      description,
      images,
      title,
    },
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(locales.map((entry) => [entry, `/${entry}`])),
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

  const [navigation, footer, settings, sections] = await Promise.all([
    getNavigation(locale),
    getFooter(locale),
    getGlobalSettings(locale),
    getSectionsVisibility(locale),
  ])

  const themeStyle = buildThemeStyle(settings?.theme?.primaryColor, settings?.theme?.accentColor)
  const photoUrl = getMediaUrl(settings?.photo)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: settings?.name,
    jobTitle: settings?.profession,
    email: settings?.contactEmail,
    image: photoUrl ? `${siteUrl}${photoUrl}` : undefined,
    url: `${siteUrl}/${locale}`,
    sameAs: (settings?.socialLinks ?? []).map((link) => link.url),
  }

  return (
    <html
      className={`${fraunces.variable} ${inter.variable} ${bagelFatOne.variable}`}
      data-scroll-behavior="smooth"
      lang={locale}
      suppressHydrationWarning
    >
      <body>
        <style dangerouslySetInnerHTML={{ __html: themeStyle }} />
        <Script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          id="person-jsonld"
          type="application/ld+json"
        />
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
            <AmbientBackground />
            <CursorEffects effect={settings?.theme?.cursorEffect} />
            <div className="site-shell">
              <Header
                dictionary={dictionary}
                locale={locale}
                navigation={navigation}
                sections={sections}
                settings={settings}
              />
              <main id="main-content">
                <PageTransition>{children}</PageTransition>
              </main>
              <Footer dictionary={dictionary} footer={footer} locale={locale} />
            </div>
          </MotionProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
