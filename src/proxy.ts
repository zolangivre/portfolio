import { NextResponse, type NextRequest } from 'next/server'

import { defaultLocale, locales, type Locale } from '@/lib/locale'

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

  const hasLocalePrefix = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  )

  if (hasLocalePrefix) {
    return NextResponse.next()
  }

  const locale = detectLocale(request)
  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`

  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    // `next/` covers the draft-mode preview routes: they carry the locale in a
    // query param and redirect to the localized page themselves, so prefixing
    // them here would send the request to a route that doesn't exist.
    '/((?!admin|api|my-route|next/|_next|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)',
  ],
}
