import { Container } from '@/components/ui/Container'
import { Pill } from '@/components/ui/Pill'
import { SafeImage } from '@/components/ui/SafeImage'
import { presentTechnologies, TechChip } from '@/components/ui/TechChip'
import { formatMonthRange } from '@/lib/dates'
import type { Dictionary } from '@/lib/i18n/dictionary'
import type { Locale } from '@/lib/locale'
import { getMediaUrl } from '@/lib/media'
import type { SectionCopy } from '@/lib/sectionCopy'
import type { Experience } from '@/payload-types'

import { Reveal } from '../ui/Reveal'
import { RichText } from '../ui/RichText'
import { SectionHeader } from '../ui/SectionHeader'
import { TimelineDetails } from '../ui/TimelineDetails'
import { TimelineRail } from '../ui/TimelineRail'

type ExperienceSectionProps = {
  content: SectionCopy
  dictionary: Dictionary
  experiences: Experience[]
  locale: Locale
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
              const technologies = presentTechnologies(experience.technologies)

              return (
                <Reveal
                  className="timeline-row"
                  delay={Math.min(index, 5) * 0.08}
                  key={experience.id}
                >
                  <article className="timeline-item">
                    <div className="timeline-meta">
                      <Pill tone="accent">
                        {formatMonthRange(
                          experience.startDate,
                          experience.endDate,
                          locale,
                          dictionary.experience.present,
                        )}
                      </Pill>
                      {experience.employmentType ? (
                        <span className="text-label uppercase text-fg-subtle">
                          {experience.employmentType}
                        </span>
                      ) : null}
                    </div>
                    <h3>{experience.position}</h3>
                    {/* No wrap: a long name breaks beside the logo rather than
                        dropping below it and leaving the logo alone on a line. */}
                    <div className="timeline-company flex items-start gap-2">
                      {companyLogoUrl ? (
                        <SafeImage
                          alt=""
                          className="mt-0.5 h-5 w-5 shrink-0 object-contain"
                          height={20}
                          src={companyLogoUrl}
                          width={20}
                        />
                      ) : null}
                      {company?.website ? (
                        <a
                          className="min-w-0 transition hover:text-accent"
                          href={company.website}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {company.name}
                        </a>
                      ) : (
                        <span className="min-w-0">
                          {company?.name ?? dictionary.experience.fallbackCompany}
                        </span>
                      )}
                    </div>
                    {/* Shown on the page rather than in a `title` tooltip, which
                        keyboard and touch visitors never get to see. */}
                    {company?.description ? (
                      <p className="timeline-company mt-1 text-xs">{company.description}</p>
                    ) : null}
                    {experience.location ? (
                      <p className="timeline-company mt-1 text-xs">{experience.location}</p>
                    ) : null}
                    <div className="timeline-body">
                      {/* Folded to its opening paragraph on phones; the
                          technologies below stay in view. */}
                      <TimelineDetails
                        hideLabel={dictionary.experience.hideDetailsLabel}
                        showLabel={dictionary.experience.showDetailsLabel}
                      >
                        <RichText content={experience.description} />
                      </TimelineDetails>
                      {technologies.length > 0 ? (
                        <ul
                          aria-label={`${experience.position} ${dictionary.projects.technologiesAriaLabelSuffix}`}
                          className="mt-4 flex flex-wrap gap-2"
                        >
                          {technologies.map((technology) => (
                            <TechChip
                              key={typeof technology === 'object' ? technology.id : technology}
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
