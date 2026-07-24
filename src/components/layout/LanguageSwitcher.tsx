'use client'

import { motion } from 'motion/react'
import { usePathname } from 'next/navigation'

import type { Dictionary } from '@/lib/i18n/dictionary'
import { locales, type Locale } from '@/lib/locale'
import { LANG_TRANSITION_FLAG, LANG_TRANSITION_SCROLL_KEY } from '@/lib/motion/langTransition'

type LanguageSwitcherProps = {
  dictionary: Dictionary
  locale: Locale
}

const localeLabels: Record<Locale, string> = {
  fr: 'FR',
  en: 'EN',
}

const EXIT_DURATION_MS = 220

function handleLanguageChange(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Full reload is intentional here (see below) — only the transition
  // dressing around it is skippable for reduced motion, not the navigation.
  if (prefersReducedMotion) {
    return
  }

  event.preventDefault()

  sessionStorage.setItem(LANG_TRANSITION_SCROLL_KEY, String(window.scrollY))
  sessionStorage.setItem(LANG_TRANSITION_FLAG, '1')

  const root = document.getElementById('main-content')

  if (root) {
    root.style.transition = `opacity ${EXIT_DURATION_MS}ms ease, filter ${EXIT_DURATION_MS}ms ease, transform ${EXIT_DURATION_MS}ms ease`
    root.style.opacity = '0'
    root.style.filter = 'blur(6px)'
    root.style.transform = 'scale(0.99)'
  }

  window.setTimeout(() => {
    window.location.href = href
  }, EXIT_DURATION_MS)
}

export function LanguageSwitcher({ dictionary, locale }: LanguageSwitcherProps) {
  const pathname = usePathname()
  const localePrefix = `/${locale}`
  const suffix = pathname.startsWith(localePrefix) ? pathname.slice(localePrefix.length) : ''

  return (
    <div aria-label={dictionary.nav.languageSwitcherLabel} className="language-switcher" role="group">
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
            className="language-switcher-item"
            data-active={entry === locale}
            href={href}
            key={entry}
            onClick={(event) => handleLanguageChange(event, href)}
          >
            {entry === locale ? (
              <motion.span
                className="theme-toggle-active"
                layoutId="language-switcher-active"
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
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
