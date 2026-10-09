'use client'

import { motion } from 'motion/react'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

import type { Dictionary } from '@/lib/i18n/dictionary'
import { locales, type Locale } from '@/lib/locale'
import { DURATION_UI, EASE_OUT_PREMIUM } from '@/lib/motion/tokens'

type LanguageSwitcherProps = {
  dictionary: Dictionary
  locale: Locale
}

const localeLabels: Record<Locale, string> = {
  fr: 'FR',
  en: 'EN',
}

// Each language named in itself, as a visitor looking for it would read it.
// The visible code stays part of the label so voice control ("click EN")
// still matches.
const localeNames: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
}

const EXIT_DURATION_MS = 220
const EXIT_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)' // --ease-out-premium

function handleLanguageChange(event: React.MouseEvent<HTMLAnchorElement>) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const opensElsewhere =
    event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey

  // The navigation itself is the plain <a href> (see below) — this only
  // dresses it. The browser keeps painting this document until the next one
  // commits, so the fade plays while the new page loads instead of delaying
  // the request.
  if (prefersReducedMotion || opensElsewhere) {
    return
  }

  const root = document.getElementById('main-content')

  // Opacity and transform only — a blur here would re-rasterize the whole
  // page on every frame of the exit.
  if (root) {
    root.style.transition = `opacity ${EXIT_DURATION_MS}ms ${EXIT_EASE}, transform ${EXIT_DURATION_MS}ms ${EXIT_EASE}`
    root.style.opacity = '0'
    root.style.transform = 'scale(0.99)'
  }
}

export function LanguageSwitcher({ dictionary, locale }: LanguageSwitcherProps) {
  // Back/forward can restore this page from the bfcache exactly as it was
  // left — mid-fade at opacity 0. Undo the exit dressing when that happens.
  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (!event.persisted) {
        return
      }

      const root = document.getElementById('main-content')

      if (root) {
        root.style.transition = ''
        root.style.opacity = ''
        root.style.transform = ''
      }
    }

    window.addEventListener('pageshow', handlePageShow)

    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [])

  const pathname = usePathname()
  const localePrefix = `/${locale}`
  const suffix = pathname.startsWith(localePrefix) ? pathname.slice(localePrefix.length) : ''

  return (
    <div
      aria-label={dictionary.nav.languageSwitcherLabel}
      className="language-switcher"
      role="group"
    >
      {locales.map((entry) => {
        const href = `/${entry}${suffix}`

        return (
          // A plain <a> forces a full page load instead of a Next.js
          // client-side transition: the [locale] segment renders <html>, so
          // a client-side swap between locales remounts next-themes' inline
          // script and React rejects it ("Encountered a script tag while
          // rendering React component"). A hard navigation re-runs SSR/
          // hydration cleanly — handleLanguageChange only dresses that
          // reload with an exit animation, it doesn't replace it.
          <a
            aria-current={entry === locale ? 'true' : undefined}
            aria-label={`${localeNames[entry]} (${localeLabels[entry]})`}
            className="language-switcher-item"
            data-active={entry === locale}
            href={href}
            hrefLang={entry}
            key={entry}
            lang={entry}
            onClick={handleLanguageChange}
          >
            {entry === locale ? (
              <motion.span
                className="theme-toggle-active"
                layoutId="language-switcher-active"
                transition={{ duration: DURATION_UI, ease: EASE_OUT_PREMIUM }}
              />
            ) : null}
            <motion.span
              className="relative z-10"
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              whileHover={{ scale: 1.1 }}
            >
              {localeLabels[entry]}
            </motion.span>
          </a>
        )
      })}
    </div>
  )
}
