import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { ProjectCard } from '@/components/cards/ProjectCard'
import { getDictionary } from '@/lib/i18n/dictionary'
import type { Project, Technology } from '@/payload-types'

/**
 * A technology in the trash comes back as `null` inside `project.technologies`
 * (Payload nulls a relation to a trashed document): the list must not render
 * an empty chip for it, and not render at all when only nulls are left.
 */

const dictionary = getDictionary('fr')

const react = {
  createdAt: '2026-01-01T00:00:00.000Z',
  id: 1,
  name: 'React',
  slug: 'react',
  updatedAt: '2026-01-01T00:00:00.000Z',
} as Technology

const projectWith = (technologies: unknown[]) =>
  ({
    createdAt: '2026-01-01T00:00:00.000Z',
    description: null,
    id: 10,
    shortDescription: 'Courte description.',
    slug: 'projet-test',
    technologies,
    title: 'Projet test',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }) as unknown as Project

const renderCard = (technologies: unknown[]) =>
  render(<ProjectCard dictionary={dictionary} locale="fr" project={projectWith(technologies)} />)

describe('ProjectCard technologies', () => {
  afterEach(cleanup)

  it('renders a chip only for the technologies that still exist', () => {
    renderCard([null, react, null])

    const list = screen.getByRole('list', { name: /Projet test/ })
    const chips = screen.getAllByRole('listitem')

    expect(chips).toHaveLength(1)
    expect(list.contains(chips[0]!)).toBe(true)
    expect(chips[0]!.textContent).toBe('React')
  })

  it('renders no list when every technology is in the trash', () => {
    renderCard([null, null])

    expect(screen.queryByRole('list')).toBeNull()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('still renders an unresolved id as a chip (relation not populated)', () => {
    renderCard([42])

    expect(screen.getAllByRole('listitem')).toHaveLength(1)
  })
})
