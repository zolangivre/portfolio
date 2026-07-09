import { Container } from '@/components/ui/Container'
import type { Dictionary } from '@/lib/i18n/dictionary'
import type { Locale } from '@/lib/locale'
import type { Project } from '@/payload-types'

import { ProjectCard } from '../cards/ProjectCard'
import { SectionHeader } from '../ui/SectionHeader'

type ProjectsSectionProps = {
  dictionary: Dictionary
  locale: Locale
  projects: Project[]
}

export function ProjectsSection({ dictionary, locale, projects }: ProjectsSectionProps) {
  return (
    <section aria-labelledby="projects-title" className="content-section" id="projects">
      <Container>
        <SectionHeader
          description={dictionary.projects.description}
          eyebrow={dictionary.projects.eyebrow}
          id="projects-title"
          title={dictionary.projects.title}
        />

        {projects.length > 0 ? (
          <div className="project-grid">
            {projects.map((project) => (
              <ProjectCard dictionary={dictionary} key={project.id} locale={locale} project={project} />
            ))}
          </div>
        ) : (
          <p className="empty-state">{dictionary.projects.emptyState}</p>
        )}
      </Container>
    </section>
  )
}
