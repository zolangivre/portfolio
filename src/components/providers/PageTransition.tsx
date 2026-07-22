'use client'

import { AnimatePresence, motion } from 'motion/react'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

const transition = { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const }

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.div
        key={pathname}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
        initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
        transition={transition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
