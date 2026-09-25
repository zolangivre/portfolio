'use client'

import { motion } from 'motion/react'

import { DURATION_SLOW, EASE_OUT_PREMIUM } from '@/lib/motion/tokens'

export function Divider() {
  return (
    <motion.hr
      className="my-10 h-px w-full origin-left border-none bg-border"
      initial={{ opacity: 0, scaleX: 0 }}
      transition={{ duration: DURATION_SLOW, ease: EASE_OUT_PREMIUM }}
      viewport={{ margin: '-80px', once: true }}
      whileInView={{ opacity: 1, scaleX: 1 }}
    />
  )
}
