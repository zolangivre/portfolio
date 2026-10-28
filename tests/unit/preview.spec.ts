import { draftMode } from 'next/headers'
import { describe, expect, it, vi } from 'vitest'

import { isPreview, isSafePreviewPath, previewPath, previewURL } from '@/lib/preview'

vi.mock('next/headers', () => ({ draftMode: vi.fn(), headers: vi.fn(async () => new Headers()) }))

const auth = vi.fn()
vi.mock('@/lib/payload', () => ({ getPayloadClient: async () => ({ auth }) }))

describe('previewPath', () => {
  it('points a project at its page in the requested locale', () => {
    expect(previewPath({ collection: 'projects', data: { slug: 'alpha' }, locale: 'fr' })).toBe(
      '/fr/projects/alpha',
    )
    expect(previewPath({ collection: 'projects', data: { slug: 'alpha' }, locale: 'en' })).toBe(
      '/en/projects/alpha',
    )
  })

  it('points a journal entry at its page', () => {
    expect(previewPath({ collection: 'journal', data: { slug: 'souvenir' }, locale: 'fr' })).toBe(
      '/fr/journal/souvenir',
    )
  })

  it('falls back to the homepage for a project or entry without a slug', () => {
    expect(previewPath({ collection: 'projects', data: {}, locale: 'fr' })).toBe('/fr')
    expect(previewPath({ collection: 'projects', data: { slug: '' }, locale: 'fr' })).toBe('/fr')
    expect(previewPath({ collection: 'journal', data: {}, locale: 'en' })).toBe('/en')
  })

  it('falls back to the homepage for every other collection, even with a slug', () => {
    for (const collection of ['experiences', 'education', 'testimonials', 'categories', 'skills']) {
      expect(previewPath({ collection, data: { slug: 'x' }, locale: 'en' })).toBe('/en')
    }
  })

  it('falls back to the homepage for a global', () => {
    expect(previewPath({ data: { slug: 'x' }, global: 'hero', locale: 'fr' })).toBe('/fr')
  })
})

describe('previewURL', () => {
  const url = (headers: Record<string, string>, path = '/fr/projects/alpha') =>
    previewURL({ headers: new Headers(headers), path })

  it('is absolute, on the origin of the request, with the path encoded', () => {
    expect(url({ host: 'example.com' })).toBe(
      `https://example.com/api/preview?path=${encodeURIComponent('/fr/projects/alpha')}`,
    )
  })

  it('prefers the forwarded host and protocol over host', () => {
    expect(
      url({
        host: 'internal:3000',
        'x-forwarded-host': 'zolan.dev',
        'x-forwarded-proto': 'https',
      }),
    ).toBe(`https://zolan.dev/api/preview?path=${encodeURIComponent('/fr/projects/alpha')}`)
  })

  it('honours an http forwarded protocol', () => {
    expect(url({ host: 'example.com', 'x-forwarded-proto': 'http' }, '/en')).toBe(
      'http://example.com/api/preview?path=%2Fen',
    )
  })

  it('defaults to http on localhost and 127.0.0.1, keeping the port', () => {
    expect(url({ host: 'localhost:3000' }, '/fr')).toBe(
      'http://localhost:3000/api/preview?path=%2Ffr',
    )
    expect(url({ host: '127.0.0.1:3100' }, '/fr')).toBe(
      'http://127.0.0.1:3100/api/preview?path=%2Ffr',
    )
  })

  it('defaults to https for any other host', () => {
    expect(url({ host: 'localhost.evil.com' }, '/fr')).toMatch(/^https:\/\//)
  })
})

describe('isSafePreviewPath', () => {
  it.each(['/fr', '/en', '/fr/projects/alpha', '/en/journal/x'])('accepts %s', (path) => {
    expect(isSafePreviewPath(path)).toBe(true)
  })

  it.each([
    '//evil.com',
    '//fr',
    'https://evil.com/fr',
    'https://example.com',
    '/de',
    '/de/projects',
    '/admin',
    '/frfoo',
    '/french',
    'fr',
    '/',
    '',
    '/fr\\evil',
    '/\\evil.com',
    '\\\\evil.com',
  ])('rejects %j', (path) => {
    expect(isSafePreviewPath(path)).toBe(false)
  })

  it.each([undefined, null, 42, {}, ['/fr'], true])('rejects the non-string %j', (value) => {
    expect(isSafePreviewPath(value)).toBe(false)
  })
})

describe('previewURL behind several proxies', () => {
  it('takes the first forwarded host and protocol, and falls back to host', () => {
    expect(
      previewURL({
        headers: new Headers({
          'x-forwarded-host': 'zolan.dev, internal.proxy',
          'x-forwarded-proto': 'https, http',
        }),
        path: '/fr',
      }),
    ).toBe('https://zolan.dev/api/preview?path=%2Ffr')

    expect(
      previewURL({
        headers: new Headers({ host: 'zolan.dev', 'x-forwarded-host': 'evil.com/path' }),
        path: '/fr',
      }),
    ).toBe('https://zolan.dev/api/preview?path=%2Ffr')
  })

  it('ignores a forwarded protocol that is neither http nor https', () => {
    expect(
      previewURL({
        headers: new Headers({ host: 'zolan.dev', 'x-forwarded-proto': 'javascript' }),
        path: '/fr',
      }),
    ).toBe('https://zolan.dev/api/preview?path=%2Ffr')
  })
})

describe('isSafePreviewPath and header-unsafe characters', () => {
  it.each(['/fr/日本', '/fr/a b', '/fr/a\nb'])('rejects %j', (path) => {
    expect(isSafePreviewPath(path)).toBe(false)
  })
})

describe('isPreview', () => {
  it('is true when Draft Mode is enabled for a logged-in editor', async () => {
    vi.mocked(draftMode).mockResolvedValue({ isEnabled: true } as never)
    auth.mockResolvedValue({ user: { id: 1 } })

    expect(await isPreview()).toBe(true)
  })

  // The Draft Mode cookie outlives the admin session.
  it('is false when Draft Mode is on but nobody is logged in', async () => {
    vi.mocked(draftMode).mockResolvedValue({ isEnabled: true } as never)
    auth.mockResolvedValue({ user: null })

    expect(await isPreview()).toBe(false)
  })

  it('is false when the session check fails', async () => {
    vi.mocked(draftMode).mockResolvedValue({ isEnabled: true } as never)
    auth.mockRejectedValue(new Error('database down'))

    expect(await isPreview()).toBe(false)
  })

  it('does not check the session outside Draft Mode', async () => {
    vi.mocked(draftMode).mockResolvedValue({ isEnabled: false } as never)

    await isPreview()

    expect(auth).not.toHaveBeenCalled()
  })

  it('is false when Draft Mode is off', async () => {
    vi.mocked(draftMode).mockResolvedValue({ isEnabled: false } as never)

    expect(await isPreview()).toBe(false)
  })

  it('is false, without throwing, outside a request scope', async () => {
    vi.mocked(draftMode).mockImplementation(() => {
      throw new Error('`draftMode` was called outside a request scope.')
    })

    await expect(isPreview()).resolves.toBe(false)
  })

  it('is false when reading Draft Mode rejects', async () => {
    vi.mocked(draftMode).mockRejectedValue(new Error('outside a request scope'))

    await expect(isPreview()).resolves.toBe(false)
  })
})
