'use client'

import { motion } from 'motion/react'

export function Divider() {
  return (
    <motion.hr
      className="my-10 h-px w-full origin-left border-none bg-border"
      initial={{ opacity: 0, scaleX: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ margin: '-80px', once: true }}
      whileInView={{ opacity: 1, scaleX: 1 }}
    />
  )
}
