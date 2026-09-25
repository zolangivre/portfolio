'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

import { buttonClassName } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { defaultLocale, locales, type Locale } from '@/lib/locale'

/**
 * Copy lives here rather than in the shared dictionary because `not-found.tsx`
 * has to be a client component to read the active locale — the not-found
 * boundary renders without the route's params being passed down. Same tradeoff
 * as `RouteError`.
 */
const COPY: Record<Locale, { title: string; description: string; home: string; back: string }> = {
  en: {
    title: 'This page does not exist.',
    description:
      'The link may be outdated, or the page may have been unpublished. Everything else is still where you left it.',
    home: 'Back to home',
    back: 'Browse the projects',
  },
  fr: {
    title: 'Cette page n’existe pas.',
    description:
      'Le lien est peut-être obsolète, ou la page a été dépubliée. Le reste du site est toujours là.',
    home: 'Retour à l’accueil',
    back: 'Voir les projets',
  },
}

export function RouteNotFound() {
  const params = useParams<{ locale?: string }>()
  const raw = params?.locale
  const locale: Locale = locales.includes(raw as Locale) ? (raw as Locale) : defaultLocale
  const copy = COPY[locale]

  return (
    <section className="content-section">
      <Container>
        <div className="mx-auto max-w-lg text-center">
          <p className="eyebrow">404</p>
          <h1>{copy.title}</h1>
          <p className="mt-3 text-sm leading-7 text-fg-muted">{copy.description}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              className={buttonClassName()}
              href={`/${locale}`}
            >
              {copy.home}
            </Link>
            <Link
              className={buttonClassName('secondary')}
              href={`/${locale}/projects`}
            >
              {copy.back}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
