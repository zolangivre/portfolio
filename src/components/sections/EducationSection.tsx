import Image from 'next/image'

import { Container } from '@/components/ui/Container'
import type { Dictionary } from '@/lib/i18n/dictionary'
import type { Locale } from '@/lib/locale'
import { getMediaUrl } from '@/lib/media'
import type { SectionCopy } from '@/lib/sectionCopy'
import type { Education } from '@/payload-types'

import { RichText } from '../ui/RichText'
import { SectionHeader } from '../ui/SectionHeader'

type EducationSectionProps = {
  content: SectionCopy
  dictionary: Dictionary
  education: Education[]
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

export function EducationSection({
  content,
  dictionary,
  education,
  locale,
}: EducationSectionProps) {
  return (
    <section aria-labelledby="education-title" className="content-section" id="education">
      <Container>
        <SectionHeader
          description={content.description}
          eyebrow={content.eyebrow}
          id="education-title"
          title={content.title}
        />

        {education.length > 0 ? (
          <div className="timeline">
            {education.map((entry) => {
              const school = typeof entry.school === 'object' && entry.school ? entry.school : null
              const schoolLogoUrl = getMediaUrl(school?.logo)

              return (
                <article className="timeline-item" key={entry.id}>
                  <div>
                    <p className="timeline-date">
                      {formatDate(entry.startDate, locale, dictionary.experience.present)} -{' '}
                      {formatDate(entry.endDate, locale, dictionary.experience.present)}
                    </p>
                    <h3>{entry.degree}</h3>
                    <div className="timeline-company flex flex-wrap items-center gap-2">
                      {schoolLogoUrl ? (
                        <Image
                          alt=""
                          className="h-5 w-5 shrink-0 object-contain"
                          height={20}
                          src={schoolLogoUrl}
                          width={20}
                        />
                      ) : null}
                      {school?.website ? (
                        <a
                          className="transition hover:text-accent"
                          href={school.website}
                          rel="noreferrer"
                          target="_blank"
                          title={school.description ?? undefined}
                        >
                          {school.name}
                        </a>
                      ) : (
                        <span title={school?.description ?? undefined}>
                          {school?.name ?? dictionary.education.fallbackSchool}
                        </span>
                      )}
                    </div>
                    {entry.location ? (
                      <p className="timeline-company mt-1 text-xs">{entry.location}</p>
                    ) : null}
                  </div>
                  <div className="text-fg-muted">
                    <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
                      {entry.fieldOfStudy ? <h3>{entry.fieldOfStudy}</h3> : null}
                    </div>
                    {entry.description ? <RichText content={entry.description} /> : null}
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <p className="empty-state">{dictionary.education.emptyState}</p>
        )}
      </Container>
    </section>
  )
}
