import Image from 'next/image'

import { Container } from '@/components/ui/Container'
import { getMediaUrl } from '@/lib/media'
import type { Hero, Setting } from '@/payload-types'

type HeroSectionProps = {
  hero: Hero | null
  settings: Setting | null
}

export function HeroSection({ hero, settings }: HeroSectionProps) {
  const title = hero?.title ?? 'Building polished digital products with calm, modern engineering.'
  const highlights = (hero?.highlights ?? []).filter((item) => item.value.trim().length > 0)
  const primaryCta = hero?.primaryCta
  const secondaryCta = hero?.secondaryCta
  const photoUrl = getMediaUrl(settings?.photo)

  return (
    <section className="hero-section" aria-labelledby="hero-title">
      <Container
        className={photoUrl ? 'lg:flex lg:items-center lg:justify-between lg:gap-12' : undefined}
      >
        <div className="hero-copy">
          {hero?.eyebrow ? <p className="eyebrow">{hero.eyebrow}</p> : null}
          <h1 id="hero-title">{title}</h1>
          {hero?.description ? <p>{hero.description}</p> : null}
          <div className="mt-8 flex flex-wrap gap-3">
            {primaryCta?.label && primaryCta?.href ? (
              <a
                className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-fg transition hover:bg-accent-strong"
                href={primaryCta.href}
              >
                {primaryCta.label}
              </a>
            ) : null}
            {secondaryCta?.label && secondaryCta?.href ? (
              <a
                className="rounded-full border border-border-strong bg-surface px-5 py-3 text-sm font-semibold text-fg transition hover:border-accent-soft-border hover:text-accent"
                href={secondaryCta.href}
              >
                {secondaryCta.label}
              </a>
            ) : null}
          </div>
          {highlights.length > 0 ? (
            <div className="mt-8 flex flex-wrap gap-4 text-sm text-fg-muted">
              {highlights.map((item, index) => (
                <span key={`${item.value}-${index}`}>
                  {item.value}
                  {index < highlights.length - 1 ? <span className="mx-2">•</span> : null}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        {photoUrl ? (
          <div className="relative mt-10 aspect-4/5 w-full max-w-sm overflow-hidden rounded-4xl border border-border bg-surface shadow-xl shadow-black/10 lg:mt-0 lg:w-80 lg:shrink-0">
            <Image
              alt=""
              className="object-contain"
              fill
              priority
              sizes="(min-width: 1024px) 320px, 100vw"
              src={photoUrl}
            />
          </div>
        ) : null}
      </Container>
    </section>
  )
}
