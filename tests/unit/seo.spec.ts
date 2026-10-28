/**
 * Contract for src/lib/seo.ts (plan 008). Argument shapes the builders take:
 *
 *   pageMetadata({ locale, path, title, description, siteName, type, publishedTime? })
 *   personJsonLd({ siteUrl, locale, name, jobTitle, email, photoUrl, sameAs })
 *   websiteJsonLd({ siteUrl, locale, name })
 *   projectJsonLd({ siteUrl, locale, slug, title, description, imageUrl, year, technologies, authorName })
 *   journalJsonLd({ siteUrl, locale, slug, title, description, imageUrl, date, updatedAt, authorName })
 *
 * `photoUrl` / `imageUrl` may be absolute or relative to `siteUrl`; the output
 * is always an absolute URL. `path` starts with "/" (or is "" for a locale
 * root). Optional fields left undefined are omitted, never "undefined".
 * `technologies` is a string[]; `year` a number; dates are ISO strings.
 */
import { describe, expect, it } from 'vitest'

import { journalJsonLd, pageMetadata, personJsonLd, projectJsonLd, websiteJsonLd } from '@/lib/seo'

const siteUrl = 'https://site.test'

const page = (overrides: Record<string, unknown> = {}) =>
  pageMetadata({
    description: 'A description',
    locale: 'en',
    path: '/projects/alpha',
    siteName: 'Site',
    title: 'Alpha',
    type: 'website',
    ...overrides,
  } as never)

describe('pageMetadata', () => {
  it('makes the page its own canonical, resolved later by metadataBase', () => {
    expect(page().alternates?.canonical).toBe('/en/projects/alpha')
  })

  it('links both translations and x-default to the French page', () => {
    expect(page().alternates?.languages).toEqual({
      en: '/en/projects/alpha',
      fr: '/fr/projects/alpha',
      'x-default': '/fr/projects/alpha',
    })
  })

  it('shares the same alternates whatever the current locale', () => {
    expect(page({ locale: 'fr' }).alternates?.canonical).toBe('/fr/projects/alpha')
    expect(page({ locale: 'fr' }).alternates?.languages).toEqual(page().alternates?.languages)
  })

  it('fills openGraph from the page, with its own url and no image', () => {
    const og = page().openGraph as Record<string, unknown>

    expect(og).toMatchObject({
      description: 'A description',
      siteName: 'Site',
      title: 'Alpha',
      type: 'website',
      url: '/en/projects/alpha',
    })
    expect(og.locale).toBeTruthy()
    expect(og.images).toBeUndefined()
  })

  it('sets the open graph locale from the page locale', () => {
    const fr = page({ locale: 'fr' }).openGraph as Record<string, unknown>
    const en = page({ locale: 'en' }).openGraph as Record<string, unknown>

    expect(fr.locale).not.toEqual(en.locale)
    expect(String(fr.locale)).toMatch(/^fr/)
    expect(String(en.locale)).toMatch(/^en/)
  })

  it('describes the card for X with the page title and no image', () => {
    const twitter = page().twitter as Record<string, unknown>

    expect(twitter).toMatchObject({
      card: 'summary_large_image',
      description: 'A description',
      title: 'Alpha',
    })
    expect(twitter.images).toBeUndefined()
  })

  it('adds publishedTime for an article only', () => {
    const article = page({ publishedTime: '2026-01-02T00:00:00.000Z', type: 'article' })
      .openGraph as Record<string, unknown>
    const website = page({ publishedTime: '2026-01-02T00:00:00.000Z', type: 'website' })
      .openGraph as Record<string, unknown>

    expect(article).toMatchObject({ publishedTime: '2026-01-02T00:00:00.000Z', type: 'article' })
    expect(website.publishedTime).toBeUndefined()
  })

  it('does not invent publishedTime for an article without a date', () => {
    const og = page({ type: 'article' }).openGraph as Record<string, unknown>

    expect(og.publishedTime).toBeUndefined()
  })
})

describe('personJsonLd', () => {
  const person = (photoUrl?: string) =>
    personJsonLd({
      email: 'me@site.test',
      jobTitle: 'Engineer',
      locale: 'fr',
      name: 'Zolan',
      photoUrl,
      sameAs: ['https://github.com/z'],
      siteUrl,
    } as never) as Record<string, unknown>

  it('describes a Person with the site as its url', () => {
    expect(person()).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Person',
      email: 'me@site.test',
      jobTitle: 'Engineer',
      name: 'Zolan',
      sameAs: ['https://github.com/z'],
    })
    expect(String(person().url)).toContain(siteUrl)
  })

  it('keeps an already absolute photo URL intact', () => {
    expect(person('https://media.zolangivre.com/x.webp').image).toBe(
      'https://media.zolangivre.com/x.webp',
    )
  })

  it('resolves a relative photo URL against the site', () => {
    expect(person('/api/media/file/x.webp').image).toBe('https://site.test/api/media/file/x.webp')
  })

  it('omits the image when there is no photo', () => {
    expect(person().image).toBeUndefined()
    expect(JSON.stringify(person())).not.toContain('undefined')
  })
})

describe('websiteJsonLd', () => {
  it('describes the WebSite of the locale', () => {
    expect(websiteJsonLd({ locale: 'en', name: 'Site', siteUrl } as never)).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      inLanguage: 'en',
      name: 'Site',
      url: 'https://site.test/en',
    })
  })
})

describe('projectJsonLd', () => {
  const project = (overrides: Record<string, unknown> = {}) =>
    projectJsonLd({
      authorName: 'Zolan',
      description: 'Desc',
      imageUrl: 'https://media.test/logo.webp',
      locale: 'fr',
      siteUrl,
      slug: 'alpha',
      technologies: ['React', 'Payload'],
      title: 'Alpha',
      year: 2024,
      ...overrides,
    } as never) as Record<string, unknown>

  it('describes a CreativeWork with its public url and language', () => {
    expect(project()).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      description: 'Desc',
      image: 'https://media.test/logo.webp',
      inLanguage: 'fr',
      name: 'Alpha',
      url: 'https://site.test/fr/projects/alpha',
    })
  })

  it('credits the author as a Person pointing at the locale home', () => {
    expect(project().author).toEqual({
      '@type': 'Person',
      name: 'Zolan',
      url: 'https://site.test/fr',
    })
  })

  it('lists technologies as keywords and the year as dateCreated', () => {
    const { dateCreated, keywords } = project()

    expect(String(keywords)).toContain('React')
    expect(String(keywords)).toContain('Payload')
    expect(String(dateCreated)).toContain('2024')
  })

  it('makes a relative image absolute', () => {
    expect(project({ imageUrl: '/media/logo.png' }).image).toBe('https://site.test/media/logo.png')
  })

  it('omits what the project does not have', () => {
    const bare = project({ imageUrl: undefined, technologies: undefined, year: undefined })

    expect(bare.image).toBeUndefined()
    expect(bare.dateCreated).toBeUndefined()
    expect(JSON.stringify(bare)).not.toContain('undefined')
  })
})

describe('journalJsonLd', () => {
  const entry = (overrides: Record<string, unknown> = {}) =>
    journalJsonLd({
      authorName: 'Zolan',
      date: '2026-01-02T00:00:00.000Z',
      description: 'Desc',
      imageUrl: 'https://media.test/photo.webp',
      locale: 'en',
      siteUrl,
      slug: 'nepal',
      title: 'Nepal',
      updatedAt: '2026-02-03T00:00:00.000Z',
      ...overrides,
    } as never) as Record<string, unknown>

  it('describes a BlogPosting with headline, dates and url', () => {
    expect(entry()).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      dateModified: '2026-02-03T00:00:00.000Z',
      datePublished: '2026-01-02T00:00:00.000Z',
      description: 'Desc',
      headline: 'Nepal',
      image: 'https://media.test/photo.webp',
      inLanguage: 'en',
      url: 'https://site.test/en/journal/nepal',
    })
  })

  it('credits the author as a Person pointing at the locale home', () => {
    expect(entry().author).toEqual({
      '@type': 'Person',
      name: 'Zolan',
      url: 'https://site.test/en',
    })
  })

  it('omits the image when the entry has no photo', () => {
    const bare = entry({ imageUrl: undefined })

    expect(bare.image).toBeUndefined()
    expect(JSON.stringify(bare)).not.toContain('undefined')
  })
})
