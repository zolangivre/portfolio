'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Container } from '@/components/ui/Container'
import { getDictionary } from '@/lib/i18n/dictionary'
import { defaultLocale, locales, type Locale } from '@/lib/locale'

/**
 * Next does not pass params to not-found boundaries, so the locale is read
 * from the pathname instead — that keeps the 404 in the same language as the
 * page the visitor was trying to reach.
 */
export default function NotFound() {
  const pathname = usePathname()
  const segment = pathname?.split('/')[1]
  const locale: Locale = locales.includes(segment as Locale) ? (segment as Locale) : defaultLocale
  const dictionary = getDictionary(locale)

  return (
    <section className="content-section">
      <Container>
        <p className="eyebrow">{dictionary.notFound.eyebrow}</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
          {dictionary.notFound.title}
        </h1>
        <p className="mt-4 max-w-xl text-fg-muted">{dictionary.notFound.description}</p>
        <Link
          className="link-underline mt-8 inline-block text-sm font-medium text-fg transition hover:text-accent"
          href={`/${locale}`}
        >
          {dictionary.notFound.homeLabel}
        </Link>
      </Container>
    </section>
  )
}
