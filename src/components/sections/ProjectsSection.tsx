import { Container } from '@/components/ui/Container'
import type { Dictionary } from '@/lib/i18n/dictionary'
import type { Locale } from '@/lib/locale'
import type { SectionCopy } from '@/lib/sectionCopy'
import type { Project } from '@/payload-types'

import { ProjectCard } from '../cards/ProjectCard'
import { Shelf } from '../ui/Shelf'
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
          // A grid from 720px; below that, a row of cards to swipe through.
          <Shelf
            navLabel={dictionary.projects.shelfNavLabel}
            titles={projects.map((project) => project.title)}
          >
            {/* amount 0.01: on the phone shelf only a sliver of the next card
                peeks in, and it has to be visible — it's what says the row
                goes on. */}
            <RevealGroup amount={0.01} className="project-grid shelf" scale={0.96}>
              {projects.map((project) => (
                <ProjectCard
                  dictionary={dictionary}
                  key={project.id}
                  locale={locale}
                  project={project}
                />
              ))}
            </RevealGroup>
          </Shelf>
        ) : (
          <p className="empty-state">{dictionary.projects.emptyState}</p>
        )}
      </Container>
    </section>
  )
}
