import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'

import { locales } from '@/lib/locale'
import { config, proxy } from '@/proxy'

const request = (path: string, acceptLanguage?: string) =>
  new NextRequest(`http://localhost:3000${path}`, {
    headers: acceptLanguage ? { 'accept-language': acceptLanguage } : {},
  })

const redirectTarget = (path: string, acceptLanguage?: string) => {
  const response = proxy(request(path, acceptLanguage))
  const location = response.headers.get('location')

  return location ? new URL(location).pathname + new URL(location).search : null
}

describe('proxy', () => {
  it.each([
    ['/', undefined, '/fr'],
    ['/', 'en-US,en;q=0.9', '/en'],
    ['/', 'fr-FR,fr;q=0.9,en;q=0.8', '/fr'],
    ['/', 'de-DE,en;q=0.5', '/en'],
    ['/', 'de-DE,es;q=0.5', '/fr'],
    ['/projects/some-slug', 'en', '/en/projects/some-slug'],
    ['/journal?category=sport', undefined, '/fr/journal?category=sport'],
    // Not a locale prefix, just a path that starts with the same letters.
    ['/english', undefined, '/fr/english'],
  ])('redirects %s (Accept-Language %j) to %s', (path, acceptLanguage, expected) => {
    expect(redirectTarget(path, acceptLanguage)).toBe(expected)
  })

  // The header is read in order and q-values are ignored. Browsers always
  // send it sorted by preference, so this only matters for hand-built headers.
  it('takes the first supported language regardless of q-values', () => {
    expect(redirectTarget('/', 'fr;q=0.1, en;q=0.9')).toBe('/fr')
  })

  it.each([
    '/wp-login.php',
    '/wp-admin/setup-config.php',
    '/wp-admin/',
    '/wp-content/plugins/x/readme.txt',
    '/xmlrpc.php',
    '/.env',
    '/.git/config',
    '/backup/.aws/credentials',
    '/cgi-bin/luci.cgi',
    '/config.yml',
    '/db.sql',
  ])('answers 404 to the scanner probe %s without a redirect', (path) => {
    const response = proxy(request(path))

    expect(response.status).toBe(404)
    expect(response.headers.get('location')).toBeNull()
  })

  // Close to a probe, but real paths: they still go to their localized page.
  it.each([
    ['/projects/wordpress-site', '/fr/projects/wordpress-site'],
    ['/journal/php-in-2026', '/fr/journal/php-in-2026'],
    ['/env', '/fr/env'],
  ])('still redirects %s', (path, expected) => {
    expect(redirectTarget(path)).toBe(expected)
  })

  it.each(['/fr', '/en', '/fr/projects', '/en/journal/some-entry'])(
    'lets %s through untouched',
    (path) => {
      const response = proxy(request(path, 'en'))

      expect(response.headers.get('location')).toBeNull()
      expect(response.headers.get('x-middleware-next')).toBe('1')
    },
  )
})

describe('proxy matcher', () => {
  const matcher = new RegExp(`^${config.matcher[0]}$`)

  it.each(['/', '/projects', '/english', '/french/page', '/wp-login.php', '/.env'])(
    'runs on %s',
    (path) => {
      expect(matcher.test(path)).toBe(true)
    },
  )

  it.each([
    // Localized pages: the cache serves them without the proxy.
    '/fr',
    '/en',
    '/fr/journal/some-entry',
    '/en/projects/some-slug',
    '/fr/opengraph-image-card',
    '/admin',
    '/admin/collections/projects',
    '/api/projects',
    '/_next/static/chunk.js',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/icon.png',
    '/fonts/display.css',
  ])('skips %s', (path) => {
    expect(matcher.test(path)).toBe(false)
  })

  // The matcher spells the locales out (Next reads it at build time): a
  // locale added to the list must be added there too.
  it.each(locales)('skips every page of the %s locale', (locale) => {
    expect(matcher.test(`/${locale}`)).toBe(false)
    expect(matcher.test(`/${locale}/journal`)).toBe(false)
  })
})
