import Image from 'next/image'

import { Container } from '@/components/ui/Container'
import { TechChip } from '@/components/ui/TechChip'
import type { Dictionary } from '@/lib/i18n/dictionary'
import type { Locale } from '@/lib/locale'
import { getMediaUrl } from '@/lib/media'
import type { SectionCopy } from '@/lib/sectionCopy'
import type { Experience } from '@/payload-types'

import { Reveal } from '../ui/Reveal'
import { RichText } from '../ui/RichText'
import { SectionHeader } from '../ui/SectionHeader'
import { TimelineRail } from '../ui/TimelineRail'

type ExperienceSectionProps = {
  content: SectionCopy
  dictionary: Dictionary
  experiences: Experience[]
  locale: Locale
}

function formatDate(value: string | null | undefined, locale: Locale, present: string) {
  if (!value) {
    return present
  }

  return new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(
    new Date(value),
  )
}

export function ExperienceSection({
  content,
  dictionary,
  experiences,
  locale,
}: ExperienceSectionProps) {
  return (
    <section aria-labelledby="experience-title" className="content-section" id="experience">
      <Container>
        <SectionHeader
          description={content.description}
          eyebrow={content.eyebrow}
          id="experience-title"
          title={content.title}
        />

        {experiences.length > 0 ? (
          <div className="timeline">
            <TimelineRail />
            {experiences.map((experience, index) => {
              const company =
                typeof experience.company === 'object' && experience.company
                  ? experience.company
                  : null
              const companyLogoUrl = getMediaUrl(company?.logo)
              const technologies = experience.technologies ?? []

              return (
                <Reveal
                  className="timeline-row"
                  delay={Math.min(index, 5) * 0.08}
                  key={experience.id}
                >
                  <article className="timeline-item">
                    <div className="timeline-meta">
                      <span className="timeline-date">
                        {formatDate(experience.startDate, locale, dictionary.experience.present)} –{' '}
                        {formatDate(experience.endDate, locale, dictionary.experience.present)}
                      </span>
                      {experience.employmentType ? (
                        <span className="text-xs font-medium uppercase tracking-widest text-fg-subtle">
                          {experience.employmentType}
                        </span>
                      ) : null}
                    </div>
                    <h3>{experience.position}</h3>
                    <div className="timeline-company flex flex-wrap items-center gap-2">
                      {companyLogoUrl ? (
                        <Image
                          alt=""
                          className="h-5 w-5 shrink-0 object-contain"
                          height={20}
                          src={companyLogoUrl}
                          width={20}
                        />
                      ) : null}
                      {company?.website ? (
                        <a
                          className="transition hover:text-accent"
                          href={company.website}
                          rel="noreferrer"
                          target="_blank"
                          title={company.description ?? undefined}
                        >
                          {company.name}
                        </a>
                      ) : (
                        <span title={company?.description ?? undefined}>
                          {company?.name ?? dictionary.experience.fallbackCompany}
                        </span>
                      )}
                    </div>
                    {experience.location ? (
                      <p className="timeline-company mt-1 text-xs">{experience.location}</p>
                    ) : null}
                    <div className="timeline-body">
                      <RichText content={experience.description} />
                      {technologies.length > 0 ? (
                        <ul
                          aria-label={`${experience.position} ${dictionary.projects.technologiesAriaLabelSuffix}`}
                          className="mt-4 flex flex-wrap gap-2"
                        >
                          {technologies.map((technology, techIndex) => (
                            <TechChip
                              key={
                                typeof technology === 'object' && technology
                                  ? technology.id
                                  : techIndex
                              }
                              technology={technology}
                            />
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </article>
                </Reveal>
              )
            })}
          </div>
        ) : (
          <p className="empty-state">{dictionary.experience.emptyState}</p>
        )}
      </Container>
    </section>
  )
}
