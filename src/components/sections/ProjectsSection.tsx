import { Container } from '@/components/ui/Container'
import type { Dictionary } from '@/lib/i18n/dictionary'
import type { Locale } from '@/lib/locale'
import type { SectionCopy } from '@/lib/sectionCopy'
import type { Project } from '@/payload-types'

import { ProjectCard } from '../cards/ProjectCard'
import { RevealGroup } from '../ui/RevealGroup'
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
          <RevealGroup className="project-grid" scale={0.96}>
            {projects.map((project) => (
              <ProjectCard dictionary={dictionary} key={project.id} locale={locale} project={project} />
            ))}
          </RevealGroup>
        ) : (
          <p className="empty-state">{dictionary.projects.emptyState}</p>
        )}
      </Container>
    </section>
  )
}
