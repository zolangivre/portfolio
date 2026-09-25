'use client'

import { motion } from 'motion/react'

import { cardClassName, cardFrameClassName } from '@/components/ui/Card'
import { RichText } from '@/components/ui/RichText'
import { DURATION_SLOW, EASE_OUT_PREMIUM } from '@/lib/motion/tokens'
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
      duration: DURATION_SLOW,
      ease: EASE_OUT_PREMIUM,
      staggerChildren: 0.1,
    },
  }),
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION_SLOW, ease: EASE_OUT_PREMIUM } },
}

export function PointGroupCard({ content, delay, title }: PointGroupCardProps) {
  return (
    // The entrance animation runs on the static .card-glow wrapper and the
    // hover lift on the inner card, so motion's inline `transform` never
    // overrides .card-lift's (see .card-glow in styles.css).
    <motion.div
      className={cardFrameClassName()}
      custom={delay}
      initial="hidden"
      variants={cardVariants}
      viewport={{ margin: '-80px', once: true }}
      whileInView="visible"
    >
      <div className={cardClassName({ className: 'h-full p-8', tone: 'accent' })}>
        <motion.p
          className="eyebrow mb-0"
          variants={itemVariants}
        >
          {title}
        </motion.p>
        {content ? (
          <motion.div className="mt-5 text-sm leading-7 text-fg" variants={itemVariants}>
            <RichText content={content} />
          </motion.div>
        ) : null}
      </div>
    </motion.div>
  )
}
