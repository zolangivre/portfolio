import Image from 'next/image'

import { Container } from '@/components/ui/Container'
import { TechChip } from '@/components/ui/TechChip'
import type { Dictionary } from '@/lib/i18n/dictionary'
import type { Locale } from '@/lib/locale'
import { getMediaUrl } from '@/lib/media'
import type { SectionCopy } from '@/lib/sectionCopy'
import type { Experience } from '@/payload-types'

import { RichText } from '../ui/RichText'
import { SectionHeader } from '../ui/SectionHeader'

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
            {experiences.map((experience) => {
              const company =
                typeof experience.company === 'object' && experience.company
                  ? experience.company
                  : null
              const companyLogoUrl = getMediaUrl(company?.logo)
              const technologies = experience.technologies ?? []

              return (
                <article className="timeline-item" key={experience.id}>
                  <div>
                    <p className="timeline-date">
                      {formatDate(experience.startDate, locale, dictionary.experience.present)} -{' '}
                      {formatDate(experience.endDate, locale, dictionary.experience.present)}
                    </p>
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
                      {experience.employmentType ? (
                        <span aria-hidden="true">· {experience.employmentType}</span>
                      ) : null}
                    </div>
                    {experience.location ? (
                      <p className="timeline-company mt-1 text-xs">{experience.location}</p>
                    ) : null}
                  </div>
                  <div>
                    <RichText content={experience.description} />
                    {technologies.length > 0 ? (
                      <ul
                        aria-label={`${experience.position} ${dictionary.projects.technologiesAriaLabelSuffix}`}
                        className="mt-4 flex flex-wrap gap-2"
                      >
                        {technologies.map((technology, index) => (
                          <TechChip
                            key={typeof technology === 'object' && technology ? technology.id : index}
                            technology={technology}
                          />
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </article>
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
