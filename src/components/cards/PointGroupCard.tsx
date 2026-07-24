'use client'

import { motion } from 'motion/react'

import { RichText } from '@/components/ui/RichText'
import type { LexicalContent } from '@/lib/richText'

type PointGroupCardProps = {
  content?: LexicalContent | null
  delay: number
  title: string
}

const cardVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay,
      delayChildren: delay + 0.1,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
      staggerChildren: 0.1,
    },
  }),
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
}

export function PointGroupCard({ content, delay, title }: PointGroupCardProps) {
  return (
    <motion.div
      className="rounded-[28px] border border-accent-soft-border bg-accent-soft p-8 transition duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1.5 hover:border-accent-strong hover:shadow-[0_25px_60px_-15px_var(--accent-soft-border)]"
      custom={delay}
      initial="hidden"
      variants={cardVariants}
      viewport={{ margin: '-80px', once: true }}
      whileInView="visible"
    >
      <motion.p
        className="text-sm font-semibold uppercase tracking-[0.2em] text-accent"
        variants={itemVariants}
      >
        {title}
      </motion.p>
      {content ? (
        <motion.div className="mt-5 text-sm leading-7 text-fg" variants={itemVariants}>
          <RichText content={content} />
        </motion.div>
      ) : null}
    </motion.div>
  )
}
