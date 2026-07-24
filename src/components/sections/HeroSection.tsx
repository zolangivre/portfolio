'use client'

import { motion } from 'motion/react'
import Image from 'next/image'

import { Container } from '@/components/ui/Container'
import { RichText } from '@/components/ui/RichText'
import { useMagneticHover } from '@/hooks/useMagneticHover'
import { useTypewriter } from '@/hooks/useTypewriter'
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
  const typedLength = useTypewriter(title)
  const primaryCtaRef = useMagneticHover<HTMLAnchorElement>()
  const secondaryCtaRef = useMagneticHover<HTMLAnchorElement>()
  const resumeCtaRef = useMagneticHover<HTMLAnchorElement>()
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
          <motion.h1 aria-label={title} id="hero-title" variants={heroItemVariants}>
            <span aria-hidden="true">
              {title.slice(0, typedLength)}
              <span className="hero-title-cursor" />
            </span>
          </motion.h1>
          {hero?.description ? (
            <motion.div variants={heroItemVariants}>
              <RichText content={hero.description} />
            </motion.div>
          ) : null}
          <motion.div className="mt-8 flex flex-wrap gap-3" variants={heroItemVariants}>
            {primaryCta?.label && primaryCta?.href ? (
              <a
                className="btn-cta rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-fg transition duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.04] active:scale-[0.97] hover:bg-accent-strong"
                href={primaryCta.href}
                ref={primaryCtaRef}
              >
                {primaryCta.label}
              </a>
            ) : null}
            {secondaryCta?.label && secondaryCta?.href ? (
              <a
                className="btn-cta rounded-full border border-border-strong bg-surface px-5 py-3 text-sm font-semibold text-fg transition duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.04] active:scale-[0.97] hover:border-accent-soft-border hover:text-accent"
                href={secondaryCta.href}
                ref={secondaryCtaRef}
              >
                {secondaryCta.label}
              </a>
            ) : null}
            {resumeCta?.label && resumeUrl ? (
              <a
                className="btn-cta rounded-full border border-border-strong bg-surface px-5 py-3 text-sm font-semibold text-fg transition duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.04] active:scale-[0.97] hover:border-accent-soft-border hover:text-accent"
                download
                href={resumeUrl}
                ref={resumeCtaRef}
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
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            className="relative mt-10 lg:mt-0"
            initial={{ opacity: 0, scale: 0.94, rotate: -2 }}
            transition={{ delay: 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              aria-hidden="true"
              className="absolute -inset-6 -z-10 rounded-[36px] bg-accent-soft opacity-0 blur-3xl"
              style={{ animation: 'hero-photo-glow 6s ease-in-out 0.8s infinite' }}
            />
            <Image
              alt=""
              className="h-auto w-full max-w-sm rounded-[28px] border border-border shadow-xl shadow-black/10 lg:w-80 lg:shrink-0"
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
