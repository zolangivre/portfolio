import Link from 'next/link'

import { Container } from '@/components/ui/Container'
import { SafeImage } from '@/components/ui/SafeImage'
import { BuiltInSocialIcon, socialLinkLabel } from '@/components/ui/SocialIcons'
import type { Dictionary } from '@/lib/i18n/dictionary'
import type { Locale } from '@/lib/locale'
import { getMediaUrl } from '@/lib/media'
import { resolveNavHref } from '@/lib/nav'
import type { Footer as FooterGlobal, Setting } from '@/payload-types'

type FooterProps = {
  dictionary: Dictionary
  footer: FooterGlobal | null
  locale: Locale
  settings: Setting | null
}

export function Footer({ dictionary, footer, locale, settings }: FooterProps) {
  const text = footer?.text
  const links = footer?.links ?? []
  const email = settings?.contactEmail
  const socialLinks = settings?.socialLinks ?? []

  return (
    <footer className="site-footer">
      <Container className="site-footer-inner">
        {text ? <p>{text}</p> : null}
        <div className="site-footer-links">
          {links.length > 0 ? (
            <nav aria-label={dictionary.nav.footerLabel} className="site-nav">
              {links.map((link) => (
                <Link href={resolveNavHref(locale, link.href)} key={link.href}>
                  {link.label}
                </Link>
              ))}
            </nav>
          ) : null}
          {/* The end of any page is where a visitor looks for a way to
              reach out: the same address and profiles as the contact
              section, from every page. Not a .site-nav: NavScrollSpy tracks
              those links against the page's sections. */}
          {email || socialLinks.length > 0 ? (
            <ul aria-label={dictionary.contact.reachOut} className="site-footer-contact">
              {email ? (
                <li>
                  <a href={`mailto:${email}`}>{email}</a>
                </li>
              ) : null}
              {socialLinks.map((link) => {
                const iconUrl = getMediaUrl(link.icon)

                return (
                  <li key={link.id ?? link.url}>
                    <a href={link.url} rel="noreferrer" target="_blank">
                      {iconUrl ? (
                        <SafeImage
                          alt=""
                          className="h-4 w-4 object-contain"
                          fallback={<BuiltInSocialIcon platform={link.platform} />}
                          height={16}
                          src={iconUrl}
                          width={16}
                        />
                      ) : (
                        <BuiltInSocialIcon platform={link.platform} />
                      )}
                      {socialLinkLabel(link.platform, link.url)}
                    </a>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>
      </Container>
    </footer>
  )
}
