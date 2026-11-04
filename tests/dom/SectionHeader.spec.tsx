import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SectionHeader } from '@/components/ui/SectionHeader'

/**
 * SectionHeader is a section's h2 on the home page; the journal list, which
 * has no other title, promotes it to the page's h1 with `as="h1"`.
 */

describe('SectionHeader heading level', () => {
  beforeEach(() => {
    // Reveal animates on scroll into view; jsdom has no IntersectionObserver.
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        disconnect() {}
        observe() {}
        takeRecords() {
          return []
        }
        unobserve() {}
      },
    )
  })
  afterEach(cleanup)

  it('renders an h2 by default', () => {
    render(<SectionHeader id="projects-title" title="Projets" />)

    expect(screen.getByRole('heading', { level: 2, name: 'Projets' })).toBeTruthy()
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
  })

  it('renders an h1 with as="h1"', () => {
    render(<SectionHeader as="h1" id="journal-title" title="Journal" />)

    expect(screen.getByRole('heading', { level: 1, name: 'Journal' })).toBeTruthy()
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull()
  })

  it('keeps the id on either level, for aria-labelledby', () => {
    render(
      <>
        <SectionHeader id="a-title" title="A" />
        <SectionHeader as="h1" id="b-title" title="B" />
      </>,
    )

    expect(screen.getByRole('heading', { level: 2 }).id).toBe('a-title')
    expect(screen.getByRole('heading', { level: 1 }).id).toBe('b-title')
  })
})
