import Image from 'next/image'

import { Container } from '@/components/ui/Container'
import { getMediaUrl } from '@/lib/media'
import type { Dictionary } from '@/lib/i18n/dictionary'
import type { About } from '@/payload-types'

import { RichText } from '../ui/RichText'
import { SectionHeader } from '../ui/SectionHeader'

type AboutSectionProps = {
  about: About | null
  dictionary: Dictionary
}

export function AboutSection({ about, dictionary }: AboutSectionProps) {
  const title = about?.title ?? 'Designing thoughtful products with engineering depth.'
  const points = about?.points ?? []
  const portraitUrl = getMediaUrl(about?.portrait)

  return (
    <section aria-labelledby="about-title" className="content-section" id="about">
      <Container>
        <SectionHeader
          description={about?.description ?? undefined}
          eyebrow={dictionary.about.eyebrow}
          id="about-title"
          title={title}
        />

        {about?.body ? (
          <div className="mb-8 max-w-2xl">
            <RichText content={about.body} />
          </div>
        ) : null}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {portraitUrl ? (
            <div className="relative aspect-4/5 w-full max-w-xs shrink-0 overflow-hidden rounded-[28px] border border-border bg-surface shadow-lg shadow-black/5">
              <Image alt="" className="object-contain" fill sizes="320px" src={portraitUrl} />
            </div>
          ) : null}

          {points.length > 0 ? (
            <div className="rounded-[28px] border border-accent-soft-border bg-accent-soft p-8 lg:max-w-md">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent">
                {dictionary.about.approachLabel}
              </p>
              <ul className="mt-5 space-y-4 text-sm leading-7 text-fg">
                {points.map((point, index) => (
                  <li key={`${point.value}-${index}`}>• {point.value}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  )
}
