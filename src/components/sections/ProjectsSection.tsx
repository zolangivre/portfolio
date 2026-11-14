import { Container } from '@/components/ui/Container'
import type { Dictionary } from '@/lib/i18n/dictionary'
import type { Locale } from '@/lib/locale'
import { featuredFirst } from '@/lib/projectOrder'
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
  const ordered = featuredFirst(projects)
  const featured = ordered.filter((project) => project.featured)
  const others = ordered.filter((project) => !project.featured)

  return (
    <section aria-labelledby="projects-title" className="content-section" id="projects">
      <Container>
        <SectionHeader
          description={content.description}
          eyebrow={content.eyebrow}
          id="projects-title"
          title={content.title}
        />

        {ordered.length > 0 ? (
          // From 720px the featured projects come first, each across the
          // section, then the others in a grid under their own heading.
          // Below that, one row of cards to swipe through, featured first:
          // the two groups dissolve into it (.shelf-group) and the heading
          // goes, so it stays a single row with a single set of dots.
          <Shelf
            navLabel={dictionary.projects.shelfNavLabel}
            titles={ordered.map((project) => project.title)}
          >
            <div className="project-list shelf">
              {featured.length > 0 ? (
                // amount 0.01: on the phone shelf only a sliver of the next
                // card peeks in, and it has to be visible — it's what says
                // the row goes on.
                <RevealGroup amount={0.01} className="project-featured shelf-group" scale={0.98}>
                  {featured.map((project, index) => (
                    <ProjectCard
                      dictionary={dictionary}
                      featured
                      key={project.id}
                      locale={locale}
                      mediaRight={index % 2 === 1}
                      project={project}
                    />
                  ))}
                </RevealGroup>
              ) : null}
              {featured.length > 0 && others.length > 0 ? (
                <h3 className="project-others-title">{dictionary.projects.othersTitle}</h3>
              ) : null}
              {others.length > 0 ? (
                <RevealGroup amount={0.01} className="project-grid shelf-group" scale={0.96}>
                  {others.map((project) => (
                    <ProjectCard
                      dictionary={dictionary}
                      key={project.id}
                      locale={locale}
                      project={project}
                    />
                  ))}
                </RevealGroup>
              ) : null}
            </div>
          </Shelf>
        ) : (
          <p className="empty-state">{dictionary.projects.emptyState}</p>
        )}
      </Container>
    </section>
  )
}
