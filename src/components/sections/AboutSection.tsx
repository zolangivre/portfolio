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
  const pointGroups = about?.pointGroups ?? []
  const portrait = about?.portrait
  const portraitUrl = getMediaUrl(portrait)
  const portraitWidth = (typeof portrait === 'object' && portrait?.width) || 800
  const portraitHeight = (typeof portrait === 'object' && portrait?.height) || 1000

  return (
    <section aria-labelledby="about-title" className="content-section" id="about">
      <Container>
        <SectionHeader
          description={about?.description ?? undefined}
          eyebrow={about?.eyebrow || dictionary.about.eyebrow}
          id="about-title"
          title={title}
        />

        {about?.body ? (
          <div className="mb-8 text-justify">
            <RichText content={about.body} />
          </div>
        ) : null}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {portraitUrl ? (
            <Image
              alt=""
              className="h-auto w-full max-w-sm rounded-4xl border border-border shadow-xl shadow-black/10 lg:w-80 lg:shrink-0"
              height={portraitHeight}
              sizes="(min-width: 1024px) 320px, 100vw"
              src={portraitUrl}
              width={portraitWidth}
            />
          ) : null}

          {pointGroups.length > 0 ? (
            <div className="grid flex-1 gap-4 sm:grid-cols-2">
              {pointGroups.map((group, groupIndex) => (
                <div
                  className="rounded-[28px] border border-accent-soft-border bg-accent-soft p-8"
                  key={`${group.title}-${groupIndex}`}
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent">
                    {group.title}
                  </p>
                  {group.content ? (
                    <div className="mt-5 text-sm leading-7 text-fg">
                      <RichText content={group.content} />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  )
}
