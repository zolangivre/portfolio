import { Container } from '@/components/ui/Container'
import type { Dictionary } from '@/lib/i18n/dictionary'
import type { Locale } from '@/lib/locale'
import type { SectionCopy } from '@/lib/sectionCopy'
import type { Project } from '@/payload-types'

import { ProjectCard } from '../cards/ProjectCard'
import { Reveal } from '../ui/Reveal'
import { SectionHeader } from '../ui/SectionHeader'

type ProjectsSectionProps = {
  content: SectionCopy
  dictionary: Dictionary
  locale: Locale
  projects: Project[]
}

export function ProjectsSection({ content, dictionary, locale, projects }: ProjectsSectionProps) {
  return (
    <section aria-labelledby="projects-title" className="content-section" id="projects">
      <Container>
        <SectionHeader
          description={content.description}
          eyebrow={content.eyebrow}
          id="projects-title"
          title={content.title}
        />

        {projects.length > 0 ? (
          <div className="project-grid">
            {projects.map((project, index) => (
              <Reveal delay={Math.min(index, 5) * 0.08} key={project.id}>
                <ProjectCard dictionary={dictionary} locale={locale} project={project} />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="empty-state">{dictionary.projects.emptyState}</p>
        )}
      </Container>
    </section>
  )
}
