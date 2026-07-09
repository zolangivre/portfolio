import type { Dictionary } from '@/lib/i18n/dictionary'
import { locales, type Locale } from '@/lib/locale'

type LanguageSwitcherProps = {
  dictionary: Dictionary
  locale: Locale
}

const localeLabels: Record<Locale, string> = {
  fr: 'FR',
  en: 'EN',
}

export function LanguageSwitcher({ dictionary, locale }: LanguageSwitcherProps) {
  return (
    <div aria-label={dictionary.nav.languageSwitcherLabel} className="language-switcher" role="group">
      {locales.map((entry) => (
        // A plain <a> forces a full page load instead of a Next.js client-side
        // transition: the [locale] segment renders <html>, so a client-side
        // swap between locales remounts next-themes' inline script and React
        // rejects it ("Encountered a script tag while rendering React
        // component"). A hard navigation re-runs SSR/hydration cleanly.
        <a
          aria-current={entry === locale ? 'true' : undefined}
          className="language-switcher-item"
          data-active={entry === locale}
          href={`/${entry}`}
          key={entry}
        >
          {localeLabels[entry]}
        </a>
      ))}
    </div>
  )
}
