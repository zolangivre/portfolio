'use client'

import { AnimatePresence, motion } from 'motion/react'
import { usePathname } from 'next/navigation'
import { useLayoutEffect, useState, type ReactNode } from 'react'

import { LANG_TRANSITION_FLAG, LANG_TRANSITION_SCROLL_KEY } from '@/lib/motion/langTransition'

const routeTransition = { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const }
const languageTransition = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }

const routeVariants = {
  initial: { opacity: 0, y: 8, filter: 'blur(4px)', scale: 1 },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 },
  exit: { opacity: 0, y: -8, filter: 'blur(4px)', scale: 1 },
}

const languageVariants = {
  initial: { opacity: 0, y: 0, filter: 'blur(10px)', scale: 1.015 },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 },
  exit: { opacity: 0, y: -8, filter: 'blur(4px)', scale: 1 },
}

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  // Captured once per mount (i.e. once per hard navigation) and compared
  // against the live pathname below, rather than kept as a standalone flag —
  // that way the special entrance only ever applies to the first route this
  // mount renders, and any later client-side navigation within the same
  // session naturally falls back to the normal route transition.
  const [languageEntrancePathname] = useState(() => {
    if (typeof window === 'undefined') {
      return null
    }

    return sessionStorage.getItem(LANG_TRANSITION_FLAG) === '1' ? window.location.pathname : null
  })
  const isLanguageEntrance = languageEntrancePathname !== null && pathname === languageEntrancePathname

  // Runs before paint so the restored scroll position never flashes at the
  // top of the page first.
  useLayoutEffect(() => {
    if (languageEntrancePathname === null) {
      return
    }

    const storedScroll = sessionStorage.getItem(LANG_TRANSITION_SCROLL_KEY)
    sessionStorage.removeItem(LANG_TRANSITION_FLAG)
    sessionStorage.removeItem(LANG_TRANSITION_SCROLL_KEY)

    if (storedScroll) {
      window.scrollTo(0, Number.parseInt(storedScroll, 10) || 0)
    }

    // The exit animation set inline styles on #main-content right before the
    // hard reload; clear them so this fresh mount isn't born invisible.
    const root = document.getElementById('main-content')
    if (root) {
      root.style.transition = ''
      root.style.opacity = ''
      root.style.filter = ''
      root.style.transform = ''
    }
    // Only ever relevant for the mount right after a language switch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        animate="animate"
        exit="exit"
        initial="initial"
        transition={isLanguageEntrance ? languageTransition : routeTransition}
        variants={isLanguageEntrance ? languageVariants : routeVariants}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
