import { FadeImage } from '@/components/ui/FadeImage'
import { Container } from '@/components/ui/Container'
import { getMediaUrl } from '@/lib/media'
import type { Dictionary } from '@/lib/i18n/dictionary'
import type { About } from '@/payload-types'

import { PointGroupCard } from '../cards/PointGroupCard'
import { Reveal } from '../ui/Reveal'
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
          <div className="mb-8">
            <RichText content={about.body} />
          </div>
        ) : null}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
          {portraitUrl ? (
            <Reveal blur={8} scale={0.96}>
              <div className="relative h-64 w-full overflow-hidden rounded-[28px] border border-border shadow-xl shadow-black/10 sm:h-96 lg:h-full lg:w-80 lg:shrink-0">
                <FadeImage
                  alt=""
                  className="object-cover"
                  fill
                  sizes="(min-width: 1024px) 320px, 100vw"
                  src={portraitUrl}
                />
              </div>
            </Reveal>
          ) : null}

          {pointGroups.length > 0 ? (
            <div className="grid flex-1 gap-4 sm:grid-cols-2">
              {pointGroups.map((group, groupIndex) => (
                <PointGroupCard
                  content={group.content}
                  delay={Math.min(groupIndex, 5) * 0.08}
                  key={`${group.title}-${groupIndex}`}
                  title={group.title}
                />
              ))}
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  )
}
