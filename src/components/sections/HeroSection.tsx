'use client'

import { motion } from 'motion/react'
import Image from 'next/image'

import { Container } from '@/components/ui/Container'
import { RichText } from '@/components/ui/RichText'
import { getMediaUrl } from '@/lib/media'
import type { Hero, Setting } from '@/payload-types'

type HeroSectionProps = {
  hero: Hero | null
  settings: Setting | null
}

const heroContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const heroItemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export function HeroSection({ hero, settings }: HeroSectionProps) {
  const title = hero?.title ?? 'Building polished digital products with calm, modern engineering.'
  const highlights = (hero?.highlights ?? []).filter((item) => item.value.trim().length > 0)
  const primaryCta = hero?.primaryCta
  const secondaryCta = hero?.secondaryCta
  const resumeCta = hero?.resumeCta
  const resumeUrl = getMediaUrl(resumeCta?.file)
  const photo = settings?.photo
  const photoUrl = getMediaUrl(photo)
  const photoWidth = (typeof photo === 'object' && photo?.width) || 800
  const photoHeight = (typeof photo === 'object' && photo?.height) || 1000

  return (
    <section className="hero-section" aria-labelledby="hero-title">
      <Container
        className={photoUrl ? 'lg:flex lg:items-center lg:justify-between lg:gap-12' : undefined}
      >
        <motion.div
          animate="visible"
          className="hero-copy"
          initial="hidden"
          variants={heroContainerVariants}
        >
          {hero?.eyebrow ? (
            <motion.p className="eyebrow" variants={heroItemVariants}>
              {hero.eyebrow}
            </motion.p>
          ) : null}
          <motion.h1 id="hero-title" variants={heroItemVariants}>
            {title}
          </motion.h1>
          {hero?.description ? (
            <motion.div variants={heroItemVariants}>
              <RichText content={hero.description} />
            </motion.div>
          ) : null}
          <motion.div className="mt-8 flex flex-wrap gap-3" variants={heroItemVariants}>
            {primaryCta?.label && primaryCta?.href ? (
              <a
                className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-fg transition active:scale-[0.97] hover:bg-accent-strong"
                href={primaryCta.href}
              >
                {primaryCta.label}
              </a>
            ) : null}
            {secondaryCta?.label && secondaryCta?.href ? (
              <a
                className="rounded-full border border-border-strong bg-surface px-5 py-3 text-sm font-semibold text-fg transition active:scale-[0.97] hover:border-accent-soft-border hover:text-accent"
                href={secondaryCta.href}
              >
                {secondaryCta.label}
              </a>
            ) : null}
            {resumeCta?.label && resumeUrl ? (
              <a
                className="rounded-full border border-border-strong bg-surface px-5 py-3 text-sm font-semibold text-fg transition active:scale-[0.97] hover:border-accent-soft-border hover:text-accent"
                download
                href={resumeUrl}
              >
                {resumeCta.label}
              </a>
            ) : null}
          </motion.div>
          {highlights.length > 0 ? (
            <motion.div
              className="mt-8 flex flex-wrap gap-4 text-sm text-fg-muted"
              variants={heroItemVariants}
            >
              {highlights.map((item, index) => (
                <span key={`${item.value}-${index}`}>
                  {item.value}
                  {index < highlights.length - 1 ? <span className="mx-2">•</span> : null}
                </span>
              ))}
            </motion.div>
          ) : null}
        </motion.div>
        {photoUrl ? (
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className="mt-10 lg:mt-0"
            initial={{ opacity: 0, scale: 0.96 }}
            transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              alt=""
              className="h-auto w-full max-w-sm rounded-4xl border border-border shadow-xl shadow-black/10 lg:w-80 lg:shrink-0"
              height={photoHeight}
              priority
              quality={90}
              sizes="(min-width: 1024px) 480px, 100vw"
              src={photoUrl}
              width={photoWidth}
            />
          </motion.div>
        ) : null}
      </Container>
    </section>
  )
}
