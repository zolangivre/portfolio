'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

import { PlaygroundBackground } from '@/components/ui/background/PlaygroundBackground'
import { buttonClassName } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { defaultLocale, locales, type Locale } from '@/lib/locale'

/**
 * Copy lives here rather than in the shared dictionary because `not-found.tsx`
 * has to be a client component to read the active locale — the not-found
 * boundary renders without the route's params being passed down. Same tradeoff
 * as `RouteError`.
 */
const COPY: Record<
  Locale,
  { title: string; description: string; home: string; back: string; hint: string }
> = {
  en: {
    title: 'This page does not exist.',
    description:
      'The link may be outdated, or the page may have been unpublished. Everything else is still where you left it.',
    home: 'Back to home',
    back: 'Browse the projects',
    hint: 'Psst… try throwing the shapes around.',
  },
  fr: {
    title: 'Cette page n’existe pas.',
    description:
      'Le lien est peut-être obsolète, ou la page a été dépubliée. Le reste du site est toujours là.',
    home: 'Retour à l’accueil',
    back: 'Voir les projets',
    hint: 'Psst… essayez de lancer les formes.',
  },
}

/** Along the edges of the screen, clear of the centred message. */
const NOT_FOUND_SPOTS: [number, number][] = [
  [0.12, 0.3],
  [0.88, 0.28],
  [0.14, 0.8],
  [0.9, 0.74],
  [0.3, 0.92],
  [0.74, 0.12],
]

export function RouteNotFound() {
  const params = useParams<{ locale?: string }>()
  const raw = params?.locale
  const locale: Locale = locales.includes(raw as Locale) ? (raw as Locale) : defaultLocale
  const copy = COPY[locale]

  return (
    <section className="content-section flex flex-1 items-center">
      {/* A dead end with something to play with: the soft shapes, settled
          along the edges so the message stays clear. */}
      <PlaygroundBackground local positions={NOT_FOUND_SPOTS} />
      <Container>
        <div className="mx-auto max-w-lg text-center">
          <p className="eyebrow">404</p>
          <h1>{copy.title}</h1>
          <p className="mt-3 text-sm leading-7 text-fg-muted">{copy.description}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link className={buttonClassName()} href={`/${locale}`}>
              {copy.home}
            </Link>
            <Link className={buttonClassName('secondary')} href={`/${locale}#projects`}>
              {copy.back}
            </Link>
          </div>
          <p className="notfound-hint mt-8 text-xs text-fg-subtle">{copy.hint}</p>
        </div>
      </Container>
    </section>
  )
}
