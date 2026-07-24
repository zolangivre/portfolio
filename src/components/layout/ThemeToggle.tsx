'use client'

import { useTheme } from 'next-themes'
import { motion } from 'motion/react'
import { useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'

import type { Dictionary } from '@/lib/i18n/dictionary'

type ThemeToggleProps = {
  dictionary: Dictionary
}

const themes = ['light', 'dark'] as const

const noopSubscribe = () => () => {}

function useMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  )
}

function SunIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="15" viewBox="0 0 16 16" width="15">
      <path
        d="M8 1.5v1.6M8 12.9v1.6M2.6 8H1M15 8h-1.6M4 4l1.1 1.1M11.9 11.9L13 13M13 4l-1.1 1.1M5.1 11.9L4 13M11.2 8a3.2 3.2 0 1 1-6.4 0 3.2 3.2 0 0 1 6.4 0Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.3"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="15" viewBox="0 0 16 16" width="15">
      <path
        d="M13.9 9.3A5.8 5.8 0 1 1 6.7 2.1a4.6 4.6 0 0 0 7.2 7.2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
    </svg>
  )
}

/**
 * Turns a theme switch into the site's signature "moment": an expanding
 * circle sweeps out from the clicked button revealing the new theme,
 * powered by the native View Transitions API. --theme-x/--theme-y feed the
 * clip-path keyframe defined in globals.css. flushSync is required so
 * next-themes' `.dark` class mutation happens synchronously inside the
 * transition callback — otherwise the "before" snapshot captured by the
 * browser would already show the new theme.
 */
function setThemeWithTransition(
  event: { currentTarget: HTMLElement },
  option: 'light' | 'dark',
  setTheme: (theme: string) => void,
) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const supportsViewTransition =
    typeof document !== 'undefined' && 'startViewTransition' in document

  if (prefersReducedMotion || !supportsViewTransition) {
    setTheme(option)
    return
  }

  const rect = event.currentTarget.getBoundingClientRect()
  document.documentElement.style.setProperty('--theme-x', `${rect.left + rect.width / 2}px`)
  document.documentElement.style.setProperty('--theme-y', `${rect.top + rect.height / 2}px`)
  ;(document as Document & { startViewTransition: (callback: () => void) => void }).startViewTransition(
    () => {
      flushSync(() => setTheme(option))
    },
  )
}

export function ThemeToggle({ dictionary }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const mounted = useMounted()

  const active = mounted ? (theme === 'system' ? resolvedTheme : theme) : undefined

  return (
    <div aria-label={dictionary.nav.themeToggleLabel} className="theme-toggle" role="group">
      {themes.map((option) => (
        <button
          aria-current={active === option ? 'true' : undefined}
          aria-label={option === 'light' ? dictionary.nav.lightLabel : dictionary.nav.darkLabel}
          className="theme-toggle-item"
          data-active={active === option}
          key={option}
          onClick={(event) => setThemeWithTransition(event, option, setTheme)}
          type="button"
        >
          {active === option ? (
            <motion.span
              className="theme-toggle-active"
              layoutId="theme-toggle-active"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            />
          ) : null}
          <motion.span
            className="theme-toggle-icon"
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            whileHover={{ rotate: 14, scale: 1.12 }}
          >
            {option === 'light' ? <SunIcon /> : <MoonIcon />}
          </motion.span>
        </button>
      ))}
    </div>
  )
}
