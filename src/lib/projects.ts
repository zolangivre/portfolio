import type { Project, Technology } from '@/payload-types'

/**
 * Technologies actually used across the given projects, deduplicated and
 * ordered by how often they appear (most-used first, then alphabetically), so
 * the archive's filter leads with the stack that best represents the work.
 */
export function collectTechnologies(projects: Project[]): Technology[] {
  const seen = new Map<number, { technology: Technology; count: number }>()

  for (const project of projects) {
    for (const technology of project.technologies ?? []) {
      if (typeof technology !== 'object' || !technology) {
        continue
      }

      const existing = seen.get(technology.id)

      if (existing) {
        existing.count += 1
      } else {
        seen.set(technology.id, { technology, count: 1 })
      }
    }
  }

  return Array.from(seen.values())
    .sort((a, b) =>
      b.count === a.count
        ? a.technology.name.localeCompare(b.technology.name)
        : b.count - a.count,
    )
    .map((entry) => entry.technology)
}

export function projectUsesTechnology(project: Project, technologyId: number): boolean {
  return (project.technologies ?? []).some(
    (technology) => typeof technology === 'object' && technology?.id === technologyId,
  )
}
