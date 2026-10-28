'use client'

import { motion } from 'motion/react'
import Image from 'next/image'

import { AvailabilityBadge, resolveAvailability } from '@/components/ui/AvailabilityBadge'
import { buttonClassName } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { RichText } from '@/components/ui/RichText'
import { useTypewriter } from '@/hooks/useTypewriter'
import { getMediaUrl, placeholderProps } from '@/lib/media'
import { DURATION_SLOW, EASE_OUT_PREMIUM } from '@/lib/motion/tokens'
import type { Hero, Setting } from '@/payload-types'

type HeroSectionProps = {
  /** Shown only while neither the hero title nor the site name is set. */
  fallbackTitle: string
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
    transition: { duration: DURATION_SLOW, ease: EASE_OUT_PREMIUM },
  },
}

/**
 * The title line wraps on phones, and should never break inside a
 * hyphenated word ("FULL- / STACK") or leave a dash opening a line: hyphens
 * between letters become non-breaking, and a dash stays with the word
 * before it.
 */
function keepTogether(text: string) {
  return text.replace(/(\p{L})-(?=\p{L})/gu, '$1\u2011').replace(/ ([—–])/g, '\u00a0$1')
}

export function HeroSection({ fallbackTitle, hero, settings }: HeroSectionProps) {
  const title = hero?.title || settings?.name || fallbackTitle
  const typedLength = useTypewriter(title)
  const availability = resolveAvailability(hero)
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
        // Below lg it reads name → photo → the rest: the text column is
        // dissolved (`contents`) so the photo can slot in under the name,
        // ordered with `order`; kept small so the name and the opening of
        // the text still fit on the first screen. The identity — title,
        // name, photo — is centred like a contact card, with the buttons;
        // the paragraphs stay left-aligned, as long text reads best. From
        // lg they sit side by side, text on the left.
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between lg:gap-12"
      >
        <motion.div
          animate="visible"
          className="hero-copy contents lg:block"
          initial="hidden"
          variants={heroContainerVariants}
        >
          {availability ? (
            <motion.div className="mb-5 self-center lg:self-auto" variants={heroItemVariants}>
              <AvailabilityBadge label={availability} />
            </motion.div>
          ) : null}
          {hero?.eyebrow ? (
            <motion.p className="eyebrow hero-eyebrow" variants={heroItemVariants}>
              {keepTogether(hero.eyebrow)}
            </motion.p>
          ) : null}
          <motion.h1
            aria-label={title}
            className="self-center lg:self-auto"
            id="hero-title"
            variants={heroItemVariants}
          >
            {/* The full name, invisible, holds the final width: centred, the
                box doesn't shift as letters are typed in — they fill it
                from the left instead of re-centring on every keystroke. */}
            <span aria-hidden="true" className="hero-title-stack">
              <span className="hero-title-ghost">{title}</span>
              <span>
                {title.slice(0, typedLength)}
                <span className="hero-title-cursor" />
              </span>
            </span>
          </motion.h1>
          {hero?.description ? (
            <motion.div className="order-2 lg:order-none" variants={heroItemVariants}>
              <RichText content={hero.description} />
            </motion.div>
          ) : null}
          <motion.div
            className="order-2 mt-8 flex flex-wrap justify-center gap-3 lg:order-none lg:justify-start"
            variants={heroItemVariants}
          >
            {primaryCta?.label && primaryCta?.href ? (
              <a className={buttonClassName()} href={primaryCta.href}>
                {primaryCta.label}
              </a>
            ) : null}
            {secondaryCta?.label && secondaryCta?.href ? (
              <a className={buttonClassName('secondary')} href={secondaryCta.href}>
                {secondaryCta.label}
              </a>
            ) : null}
            {resumeCta?.label && resumeUrl ? (
              <a className={buttonClassName('secondary')} download href={resumeUrl}>
                {resumeCta.label}
              </a>
            ) : null}
          </motion.div>
          {highlights.length > 0 ? (
            <motion.div
              className="hero-highlights dot-list order-2 mt-8 justify-center gap-y-2 text-sm text-fg-muted lg:order-none lg:justify-start"
              variants={heroItemVariants}
            >
              {highlights.map((item, index) => (
                <span key={`${item.value}-${index}`}>{item.value}</span>
              ))}
            </motion.div>
          ) : null}
        </motion.div>
        {photoUrl ? (
          <motion.div
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            className="hero-photo relative order-1 mb-7 self-center lg:order-none lg:mb-0 lg:self-auto"
            initial={{ opacity: 0, scale: 0.94, rotate: -2 }}
            transition={{ delay: 0.15, duration: DURATION_SLOW, ease: EASE_OUT_PREMIUM }}
          >
            <div
              aria-hidden="true"
              className="hero-photo-glow absolute inset-x-0 -inset-y-6 -z-10 rounded-[36px] bg-accent-soft blur-3xl lg:-inset-6"
            />
            <Image
              {...placeholderProps(photo)}
              alt=""
              className="h-auto w-52 rounded-card border border-border shadow-raised sm:w-60 lg:w-80 lg:shrink-0"
              height={photoHeight}
              priority
              quality={90}
              sizes="(min-width: 1024px) 320px, 240px"
              src={photoUrl}
              width={photoWidth}
            />
          </motion.div>
        ) : null}
      </Container>
    </section>
  )
}
