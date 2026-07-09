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
  const text =
    footer?.text ?? 'Crafted for ambitious products, polished interfaces, and reliable engineering.'
  const links = footer?.links ?? [{ label: 'Open admin', href: '/admin' }]

  return (
    <footer className="site-footer">
      <Container className="site-footer-inner">
        <p>{text}</p>
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
