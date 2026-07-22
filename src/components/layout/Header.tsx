import Link from 'next/link'

import { Container } from '@/components/ui/Container'
import type { Dictionary } from '@/lib/i18n/dictionary'
import type { Locale } from '@/lib/locale'
import { extractSectionKey, resolveNavHref } from '@/lib/nav'
import type { Navigation, SectionsVisibility, Setting } from '@/payload-types'

import { HashScrollHandler } from './HashScrollHandler'
import { HeaderScrollWatcher } from './HeaderScrollWatcher'
import { LanguageSwitcher } from './LanguageSwitcher'
import { NavScrollSpy } from './NavScrollSpy'
import { MobileNavToggle } from './MobileNavToggle'
import { RouteScrollManager } from './RouteScrollManager'
import { ThemeToggle } from './ThemeToggle'

type HeaderProps = {
  dictionary: Dictionary
  locale: Locale
  navigation: Navigation | null
  sections: SectionsVisibility | null
  settings: Setting | null
}

export function Header({ dictionary, locale, navigation, sections, settings }: HeaderProps) {
  const name = settings?.name ?? 'Portfolio'
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
  const items = (navigation?.items ?? []).filter((item) => {
    const key = extractSectionKey(item.href)

    return key === null || sections?.[key] !== false
  })
  const showJournalLink = sections?.journal !== false

  return (
    <header className="site-header p-2" data-scrolled="false">
      <HeaderScrollWatcher />
      <NavScrollSpy />
      <RouteScrollManager />
      <HashScrollHandler />
      <Container className="site-header-inner">
        <Link aria-label={name} className="site-logo" href={`/${locale}`}>
          <span className="site-logo-initials">{initials}</span>
        </Link>
        <MobileNavToggle
          closeLabel={dictionary.nav.closeMenuLabel}
          openLabel={dictionary.nav.openMenuLabel}
        >
          <nav aria-label={dictionary.nav.primaryLabel} className="site-nav">
            {items.map((item) => (
              <Link href={resolveNavHref(locale, item.href)} key={item.id ?? item.href}>
                {item.label}
              </Link>
            ))}
            {showJournalLink ? (
              <Link href={`/${locale}/journal`}>{dictionary.nav.journalLabel}</Link>
            ) : null}
          </nav>
          <div className="site-header-controls">
            <LanguageSwitcher dictionary={dictionary} locale={locale} />
            <ThemeToggle dictionary={dictionary} />
          </div>
        </MobileNavToggle>
      </Container>
    </header>
  )
}
