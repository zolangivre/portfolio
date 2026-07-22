'use client'

import { useParams } from 'next/navigation'

import { defaultLocale, type Locale } from '@/lib/locale'

const LABELS: Record<Locale, string> = {
  en: 'Loading…',
  fr: 'Chargement…',
}

/**
 * Visually-hidden aria-live announcement for route loading.tsx fallbacks.
 * loading.tsx/error.tsx special files don't receive the [locale] route
 * param as a prop, so this reads it client-side via useParams() instead.
 */
export function RouteLoadingStatus() {
  const params = useParams<{ locale?: string }>()
  const locale = (params?.locale as Locale) ?? defaultLocale
  const label = LABELS[locale] ?? LABELS[defaultLocale]

  return (
    <p className="sr-only" role="status" aria-live="polite">
      {label}
    </p>
  )
}
