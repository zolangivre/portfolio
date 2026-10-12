import Link from 'next/link'

import { Container } from '@/components/ui/Container'
import type { Dictionary } from '@/lib/i18n/dictionary'
import type { Locale } from '@/lib/locale'
import { resolveNavHref } from '@/lib/nav'
import type { Footer as FooterGlobal } from '@/payload-types'

type FooterProps = {
  dictionary: Dictionary
  footer: FooterGlobal | null
  locale: Locale
}

export function Footer({ dictionary, footer, locale }: FooterProps) {
  const text = footer?.text
  const links = footer?.links ?? []

  return (
    <footer className="site-footer">
      <Container className="site-footer-inner">
        {text ? <p>{text}</p> : null}
        <nav aria-label={dictionary.nav.footerLabel} className="site-nav">
          {links.map((link) => (
            <Link href={resolveNavHref(locale, link.href)} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </Container>
    </footer>
  )
}
