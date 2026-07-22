'use client'

import { useParams } from 'next/navigation'
import { useEffect } from 'react'

import { Container } from '@/components/ui/Container'
import { defaultLocale, type Locale } from '@/lib/locale'

const COPY: Record<Locale, { title: string; description: string; retry: string }> = {
  en: {
    title: 'Something went wrong.',
    description: 'Please try again in a moment.',
    retry: 'Try again',
  },
  fr: {
    title: 'Une erreur est survenue.',
    description: 'Merci de réessayer dans un instant.',
    retry: 'Réessayer',
  },
}

type RouteErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export function RouteError({ error, reset }: RouteErrorProps) {
  const params = useParams<{ locale?: string }>()
  const locale = (params?.locale as Locale) ?? defaultLocale
  const copy = COPY[locale] ?? COPY[defaultLocale]

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <section className="content-section">
      <Container>
        <div className="mx-auto max-w-md text-center">
          <h1>{copy.title}</h1>
          <p className="mt-3 text-sm text-fg-muted">{copy.description}</p>
          <button
            className="mt-8 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-fg transition hover:bg-accent-strong"
            onClick={reset}
            type="button"
          >
            {copy.retry}
          </button>
        </div>
      </Container>
    </section>
  )
}
