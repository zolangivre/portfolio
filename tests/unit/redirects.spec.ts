import { describe, expect, it, vi } from 'vitest'

import { redirectOldSlug, rememberLiveSlug } from '@/hooks/redirectOldSlug'
import {
  contentPath,
  normalizeRedirectPath,
  pathLocale,
  redirectCandidates,
  redirectDestination,
} from '@/lib/redirects'

describe('normalizeRedirectPath', () => {
  it.each([
    ['/fr/projects/old', '/fr/projects/old'],
    ['fr/projects/old/', '/fr/projects/old'],
    ['  /fr/projects/old  ', '/fr/projects/old'],
    ['https://www.zolangivre.com/fr/projects/old?ref=x#top', '/fr/projects/old'],
    ['/fr//projects///old', '/fr/projects/old'],
    ['/fr/old?utm=1', '/fr/old'],
    ['/', '/'],
    ['', '/'],
    ['http://[not a url', '/http:/[not a url'],
  ])('%s → %s', (input, expected) => {
    expect(normalizeRedirectPath(input)).toBe(expected)
  })
})

describe('pathLocale and redirectCandidates', () => {
  it('reads the locale a path starts with', () => {
    expect(pathLocale('/en/journal/x')).toBe('en')
    expect(pathLocale('/fr')).toBe('fr')
    expect(pathLocale('/french-toast')).toBeUndefined()
  })

  it('matches a localized path and its locale-less form', () => {
    expect(redirectCandidates('/fr/projects/old/')).toEqual(['/fr/projects/old', '/projects/old'])
    expect(redirectCandidates('/en')).toEqual(['/en', '/'])
    expect(redirectCandidates('/old')).toEqual(['/old'])
  })
})

describe('redirectDestination', () => {
  const reference = (relationTo: string, value: unknown) => ({
    to: { reference: { relationTo, value }, type: 'reference' as const },
  })

  it('sends a reference to its current URL, in the visitor’s locale', () => {
    const redirect = reference('projects', { _status: 'published', slug: 'new' })

    expect(redirectDestination(redirect as never, '/en/projects/old')).toBe('/en/projects/new')
    expect(redirectDestination(redirect as never, '/projects/old')).toBe('/fr/projects/new')
    expect(
      redirectDestination(
        reference('journal', { _status: 'published', slug: 'nepal' }) as never,
        '/fr/journal/nepal-2024',
      ),
    ).toBe(contentPath('journal', 'nepal', 'fr'))
  })

  it('goes nowhere for a draft, a trashed or deleted target, or another collection', () => {
    for (const redirect of [
      reference('projects', { _status: 'draft', slug: 'new' }),
      reference('projects', null),
      reference('projects', 7),
      reference('projects', { _status: 'published', slug: '' }),
      reference('media', { _status: 'published', slug: 'new' }),
      { to: { type: 'reference' as const, reference: null } },
      { to: null },
    ]) {
      expect(redirectDestination(redirect as never, '/fr/projects/old')).toBeNull()
    }
  })

  it('sends a custom URL as typed, but never back to the same path', () => {
    const custom = (url: string | null) => ({ to: { type: 'custom' as const, url } })

    expect(redirectDestination(custom(' https://github.com/zolangivre '), '/fr/old')).toBe(
      'https://github.com/zolangivre',
    )
    expect(redirectDestination(custom('/fr/journal'), '/fr/old')).toBe('/fr/journal')
    expect(redirectDestination(custom('/fr/old/'), '/fr/old')).toBeNull()
    expect(redirectDestination(custom('  '), '/fr/old')).toBeNull()
    expect(redirectDestination(custom(null), '/fr/old')).toBeNull()
    expect(
      redirectDestination(
        reference('projects', { _status: 'published', slug: 'same' }) as never,
        '/fr/projects/same',
      ),
    ).toBeNull()
  })
})

describe('the old-slug redirect hooks', () => {
  type Live = { _status?: string; slug?: string } | null

  const setup = (live: Live, existing: { id: number }[] = []) => {
    const payload = {
      create: vi.fn(),
      find: vi.fn().mockResolvedValue({ docs: existing }),
      findByID: vi.fn().mockResolvedValue(live),
      update: vi.fn(),
    }
    const req = { context: {} as Record<string, unknown>, payload }

    return { payload, req }
  }

  const publish = async (
    req: ReturnType<typeof setup>['req'],
    data: Record<string, unknown>,
    { operation = 'update', status = 'published' } = {},
  ) => {
    const collection = { slug: 'projects' }
    const returned = await rememberLiveSlug({
      collection,
      data,
      operation,
      originalDoc: operation === 'update' ? { id: 3 } : undefined,
      req,
    } as never)
    expect(returned).toBe(data)

    const doc = { _status: status, id: 3, slug: data.slug }
    expect(await redirectOldSlug({ collection, context: req.context, doc, req } as never)).toBe(doc)
  }

  it('redirects the live slug’s URL in both locales to the document', async () => {
    const { payload, req } = setup({ _status: 'published', slug: 'old' })

    await publish(req, { _status: 'published', slug: 'new' })

    expect(payload.create.mock.calls.map(([args]) => args.data)).toEqual([
      {
        from: '/fr/projects/old',
        to: { reference: { relationTo: 'projects', value: 3 }, type: 'reference' },
      },
      {
        from: '/en/projects/old',
        to: { reference: { relationTo: 'projects', value: 3 }, type: 'reference' },
      },
    ])
  })

  it('points an existing redirect from that URL at the document instead', async () => {
    const { payload, req } = setup({ _status: 'published', slug: 'old' }, [{ id: 9 }])

    await publish(req, { _status: 'published', slug: 'new' })

    expect(payload.create).not.toHaveBeenCalled()
    expect(payload.update).toHaveBeenCalledTimes(2)
    expect(payload.update.mock.calls[0]![0]).toMatchObject({ collection: 'redirects', id: 9 })
  })

  it('does nothing when the slug, the status or the operation says nothing moved', async () => {
    const cases: [Live, Record<string, unknown>, { operation?: string; status?: string }?][] = [
      [
        { _status: 'published', slug: 'same' },
        { _status: 'published', slug: 'same' },
      ],
      [
        { _status: 'draft', slug: 'old' },
        { _status: 'published', slug: 'new' },
      ],
      [null, { _status: 'published', slug: 'new' }],
      [
        { _status: 'published', slug: 'old' },
        { _status: 'draft', slug: 'new' },
      ],
      [{ _status: 'published', slug: 'old' }, { _status: 'published' }],
      [
        { _status: 'published', slug: 'old' },
        { _status: 'published', slug: 'new' },
        { operation: 'create' },
      ],
      [
        { _status: 'published', slug: 'old' },
        { _status: 'published', slug: 'new' },
        { status: 'draft' },
      ],
    ]

    for (const [live, data, options] of cases) {
      const { payload, req } = setup(live)
      await publish(req, data, options)
      expect(payload.create).not.toHaveBeenCalled()
      expect(payload.update).not.toHaveBeenCalled()
    }
  })
})
