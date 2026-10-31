import { expect, test, type APIRequestContext } from '@playwright/test'

import { journalEntries, projects } from './fixtures'

/** The e2e build's NEXT_PUBLIC_SITE_URL (.env.e2e), which metadataBase resolves against. */
const origin = 'http://localhost:3100'

const project = projects[0]
const entry = journalEntries[0]

/** Reads a <meta> by its property or name attribute from the raw HTML. */
const meta = (html: string, key: string) => {
  for (const tag of html.match(/<meta\b[^>]*>/g) ?? []) {
    const attr = (name: string) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1]
    if (attr('property') === key || attr('name') === key) return attr('content')
  }
}

const links = (html: string, rel: string) =>
  (html.match(/<link\b[^>]*>/g) ?? [])
    .filter((tag) => tag.match(/\brel="([^"]*)"/)?.[1] === rel)
    .map((tag) => ({
      href: tag.match(/\bhref="([^"]*)"/)?.[1],
      // React renders the attribute as hrefLang; HTML attribute names are case-insensitive.
      hreflang: tag.match(/\bhreflang="([^"]*)"/i)?.[1],
    }))

const jsonLd = (html: string) =>
  [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(
    (match) => JSON.parse(match[1].replaceAll('\\u003c', '<')) as Record<string, unknown>,
  )

const getHtml = async (request: APIRequestContext, path: string) => {
  const response = await request.get(path)
  expect(response.status(), path).toBe(200)
  return response.text()
}

const pages = [
  {
    kind: 'project',
    locale: 'fr',
    ldType: 'CreativeWork',
    ogType: 'website',
    title: project.fr,
    path: `/fr/projects/${project.slug}`,
  },
  {
    kind: 'project',
    locale: 'en',
    ldType: 'CreativeWork',
    ogType: 'website',
    title: project.en,
    path: `/en/projects/${project.slug}`,
  },
  {
    kind: 'journal entry',
    locale: 'fr',
    ldType: 'BlogPosting',
    ogType: 'article',
    title: entry.fr,
    path: `/fr/journal/${entry.slug}`,
  },
  {
    kind: 'journal entry',
    locale: 'en',
    ldType: 'BlogPosting',
    ogType: 'article',
    title: entry.en,
    path: `/en/journal/${entry.slug}`,
  },
] as const

for (const { kind, locale, ldType, ogType, title, path } of pages) {
  test.describe(`${kind} page ${path}`, () => {
    test('is its own canonical, with fr/en/x-default alternates on the same path', async ({
      request,
    }) => {
      const html = await getHtml(request, path)
      const suffix = path.slice(3)

      expect(links(html, 'canonical').map((link) => link.href)).toEqual([`${origin}${path}`])

      const alternates = Object.fromEntries(
        links(html, 'alternate').map((link) => [link.hreflang, link.href]),
      )
      expect(alternates.fr).toBe(`${origin}/fr${suffix}`)
      expect(alternates.en).toBe(`${origin}/en${suffix}`)
      expect(alternates['x-default']).toBe(`${origin}/fr${suffix}`)
    })

    test('shares with its own url, type and title on Open Graph and X', async ({ request }) => {
      const html = await getHtml(request, path)

      expect(meta(html, 'og:url')).toBe(`${origin}${path}`)
      expect(meta(html, 'og:type')).toBe(ogType)
      expect(meta(html, 'twitter:title')).toBe(title)
      expect(meta(html, 'og:title')).toBe(title)
      expect(meta(html, 'og:image:alt')).toBe(title)
    })

    test(`carries ${ldType} and Person JSON-LD in the served HTML`, async ({ request }) => {
      const data = jsonLd(await getHtml(request, path))
      const types = data.map((item) => item['@type'])

      expect(types).toContain(ldType)
      expect(types).toContain('Person')
      expect(types).toContain('WebSite')

      const main = data.find((item) => item['@type'] === ldType)
      expect(String(main?.url)).toBe(`${origin}${path}`)
      expect(main?.inLanguage).toBe(locale)
    })

    test('serves a noindex PNG card at the og:image URL', async ({ request }) => {
      const html = await getHtml(request, path)
      const image = meta(html, 'og:image')
      expect(image).toBeTruthy()

      const response = await request.get(image!)

      expect(response.status()).toBe(200)
      expect(response.headers()['content-type']).toContain('image/png')
      expect(response.headers()['x-robots-tag']).toContain('noindex')
    })
  })
}

test('the journal entry is shared as an article with its publication date', async ({ request }) => {
  const html = await getHtml(request, `/en/journal/${entry.slug}`)

  expect(meta(html, 'article:published_time')).toBeTruthy()
})

test('the journal list is its own canonical, and shared under its section title', async ({
  request,
}) => {
  const html = await getHtml(request, '/fr/journal')

  expect(links(html, 'canonical').map((link) => link.href)).toEqual([`${origin}/fr/journal`])
  expect(meta(html, 'og:url')).toBe(`${origin}/fr/journal`)
  expect(meta(html, 'twitter:title')).toBe('Journal')
})

test('the home page sends x-default and shares without a separate X image', async ({ request }) => {
  const html = await getHtml(request, '/fr')
  const alternates = Object.fromEntries(
    links(html, 'alternate').map((link) => [link.hreflang, link.href]),
  )

  expect(alternates['x-default']).toBe(`${origin}/fr`)
  expect(meta(html, 'twitter:image')).toBe(meta(html, 'og:image'))
})
