/**
 * The order projects are shown in: the featured ones first, then the rest,
 * each group in the order set by drag and drop in the admin.
 *
 * The homepage section and a project page's previous / next links both go
 * through this, so moving from one project to the next follows the order a
 * visitor saw on the homepage.
 */
export function featuredFirst<T extends { featured?: boolean | null }>(projects: T[]): T[] {
  return [
    ...projects.filter((project) => project.featured),
    ...projects.filter((project) => !project.featured),
  ]
}
