'use client'

import { useMemo, useState } from 'react'

import { ProjectCard } from '@/components/cards/ProjectCard'
import { RevealGroup } from '@/components/ui/RevealGroup'
import type { Dictionary } from '@/lib/i18n/dictionary'
import type { Locale } from '@/lib/locale'
import { collectTechnologies, projectUsesTechnology } from '@/lib/projects'
import type { Project } from '@/payload-types'

type ProjectsGridProps = {
  dictionary: Dictionary
  locale: Locale
  projects: Project[]
}

export function ProjectsGrid({ dictionary, locale, projects }: ProjectsGridProps) {
  const technologies = useMemo(() => collectTechnologies(projects), [projects])
  const [activeTechnologyId, setActiveTechnologyId] = useState<number | null>(null)

  const visibleProjects = activeTechnologyId
    ? projects.filter((project) => projectUsesTechnology(project, activeTechnologyId))
    : projects

  return (
    <>
      {technologies.length > 1 ? (
        <div aria-label={dictionary.projects.filterAriaLabel} className="category-filter" role="group">
          <button
            className="category-filter-item"
            data-active={activeTechnologyId === null}
            onClick={() => setActiveTechnologyId(null)}
            type="button"
          >
            {dictionary.projects.allTechnologiesLabel}
          </button>
          {technologies.map((technology) => (
            <button
              className="category-filter-item"
              data-active={activeTechnologyId === technology.id}
              key={technology.id}
              onClick={() => setActiveTechnologyId(technology.id)}
              type="button"
            >
              {technology.name}
            </button>
          ))}
        </div>
      ) : null}

      {visibleProjects.length > 0 ? (
        <RevealGroup className="project-grid" scale={0.96}>
          {visibleProjects.map((project) => (
            <ProjectCard dictionary={dictionary} key={project.id} locale={locale} project={project} />
          ))}
        </RevealGroup>
      ) : (
        <p className="empty-state">{dictionary.projects.emptyState}</p>
      )}
    </>
  )
}
