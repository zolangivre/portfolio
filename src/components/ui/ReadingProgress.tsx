'use client'

import { motion, useScroll } from 'motion/react'

export function ReadingProgress() {
  const { scrollYProgress } = useScroll()

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-accent"
      style={{ scaleX: scrollYProgress }}
    />
  )
}
