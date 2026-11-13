import { NextResponse, type NextRequest } from 'next/server'

import { defaultLocale, locales, type Locale } from '@/lib/locale'

/**
 * Paths only a vulnerability scanner asks for: PHP, ASP and CGI scripts,
 * dotfiles and folders (`/.env`, `/.git/config`), WordPress (`/wp-login.php`,
 * `/wp-admin/`) and config or dump files. None of them exists on this site,
 * and none can be a redirect's old URL. Sending them on to `/fr/...` costs a
 * second function call and a full render of the 404 page, and a scanner asks
 * for hundreds in a row.
 */
const SCANNER_PROBE =
  /(?:^|\/)(?:\.[^/]+|wp-[^/]*)(?:\/|$)|\.(?:php\d?|aspx?|jsp|cgi|env|ini|bak|sql|ya?ml)$/i

function detectLocale(request: NextRequest): Locale {
  const acceptLanguage = request.headers.get('accept-language')

  if (!acceptLanguage) {
    return defaultLocale
  }

  const preferred = acceptLanguage
    .split(',')
    .map((part) => part.split(';')[0]?.trim().toLowerCase().slice(0, 2))

  const match = preferred.find((lang) => locales.includes(lang as Locale))

  return (match as Locale | undefined) ?? defaultLocale
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // The matcher already skips localized paths. This stays for the case where
  // the matcher and the locale list drift apart.
  const hasLocalePrefix = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  )

  if (hasLocalePrefix) {
    return NextResponse.next()
  }

  if (SCANNER_PROBE.test(pathname)) {
    return new NextResponse(null, { status: 404 })
  }

  const locale = detectLocale(request)
  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`

  return NextResponse.redirect(url)
}

// On Vercel the proxy is a function of its own, billed for every request it
// runs on, and it runs before the cache. So it only matches the paths it has
// something to do with: not the localized pages (`/fr`, `/en/...`), which it
// would only let through, and which the cache serves without it. The locales
// are written out because Next reads this value at build time: keep them in
// step with `locales` in @/lib/locale.
export const config = {
  matcher: [
    '/((?!fr(?:/|$)|en(?:/|$)|admin|api|_next|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)',
  ],
}
