import { expect, test, type APIRequestContext } from '@playwright/test'

import { journalEntries, profession, projects } from './fixtures'

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

const title = (html: string) => html.match(/<title>([^<]*)<\/title>/)?.[1]

const website = (html: string) => jsonLd(html).find((item) => item['@type'] === 'WebSite')
const person = (html: string) => jsonLd(html).find((item) => item['@type'] === 'Person')

test.describe('home identity', () => {
  test('each locale has its own title, made of the site name and the profession', async ({
    request,
  }) => {
    const fr = await getHtml(request, '/fr')
    const en = await getHtml(request, '/en')
    const name = String(website(fr)?.name)

    expect(name).toBeTruthy()
    expect(title(fr)).toBe(`${name} \u2014 ${profession.fr}`)
    expect(title(en)).toBe(`${name} \u2014 ${profession.en}`)
    expect(title(fr)).not.toBe(title(en))
  })

  test('shares the same title on Open Graph and X', async ({ request }) => {
    for (const locale of ['fr', 'en'] as const) {
      const html = await getHtml(request, `/${locale}`)

      expect(meta(html, 'og:title')).toBe(title(html))
      expect(meta(html, 'twitter:title')).toBe(title(html))
    }
  })

  test('keeps the site title suffix on the other pages', async ({ request }) => {
    const html = await getHtml(request, `/fr/projects/${project.slug}`)

    expect(title(html)).toMatch(new RegExp(`^${project.fr} \\| .+`))
    expect(title(html)).not.toContain(profession.fr)
  })

  test('describes a single WebSite at the root of the domain from every locale', async ({
    request,
  }) => {
    for (const path of ['/fr', '/en', '/fr/journal', `/en/projects/${project.slug}`]) {
      const site = website(await getHtml(request, path))

      expect(site?.url, path).toBe(`${origin}/`)
      expect(site?.['@id'], path).toBe(`${origin}/#website`)
    }
  })

  test('describes the same Person on /fr and /en', async ({ request }) => {
    const fr = person(await getHtml(request, '/fr'))
    const en = person(await getHtml(request, '/en'))

    expect(fr?.['@id']).toBe(`${origin}/#person`)
    expect(en?.['@id']).toBe(fr?.['@id'])
  })

  test('credits the author of a project and a journal entry by the Person @id', async ({
    request,
  }) => {
    const personId = person(await getHtml(request, '/fr'))?.['@id']
    const paths = [
      ['CreativeWork', `/fr/projects/${project.slug}`],
      ['BlogPosting', `/en/journal/${entry.slug}`],
    ] as const

    for (const [type, path] of paths) {
      const main = jsonLd(await getHtml(request, path)).find((item) => item['@type'] === type)

      expect((main?.author as Record<string, unknown>)?.['@id'], path).toBe(personId)
    }
  })

  test('og:site_name is the WebSite name on every kind of page', async ({ request }) => {
    const paths = [
      '/fr',
      '/en',
      '/fr/journal',
      `/fr/projects/${project.slug}`,
      `/en/journal/${entry.slug}`,
    ]

    for (const path of paths) {
      const html = await getHtml(request, path)

      expect(meta(html, 'og:site_name'), path).toBe(String(website(html)?.name))
    }
  })
})

test.describe('journal list heading', () => {
  for (const locale of ['fr', 'en'] as const) {
    test(`/${locale}/journal has exactly one h1, the section title`, async ({ page }) => {
      await page.goto(`/${locale}/journal`)

      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)

      // The section stays labelled by that heading.
      const heading = (await page.getByRole('heading', { level: 1 }).textContent())!.trim()
      await expect(page.getByRole('region', { name: heading })).toBeVisible()
    })
  }
})
