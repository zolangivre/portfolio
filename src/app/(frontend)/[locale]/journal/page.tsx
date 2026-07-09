import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { JournalGrid } from '@/components/sections/JournalGrid'
import { Container } from '@/components/ui/Container'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { getDictionary } from '@/lib/i18n/dictionary'
import { defaultLocale, locales, type Locale } from '@/lib/locale'
import { getJournalEntries, getSectionsVisibility } from '@/lib/queries'

export const revalidate = 60

type PageParams = { locale: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>
}): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale: Locale = locales.includes(rawLocale as Locale) ? (rawLocale as Locale) : defaultLocale
  const dictionary = getDictionary(locale)

  return {
    title: dictionary.journal.title,
    description: dictionary.journal.description,
  }
}

export default async function JournalPage({ params }: { params: Promise<PageParams> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = locales.includes(rawLocale as Locale) ? (rawLocale as Locale) : defaultLocale
  const dictionary = getDictionary(locale)

  const sections = await getSectionsVisibility(locale)

  if (sections?.journal === false) {
    notFound()
  }

  const entries = await getJournalEntries(locale)

  return (
    <section aria-labelledby="journal-title" className="content-section">
      <Container>
        <Reveal>
          <SectionHeader
            description={dictionary.journal.description}
            eyebrow={dictionary.journal.eyebrow}
            id="journal-title"
            title={dictionary.journal.title}
          />
          <JournalGrid dictionary={dictionary} entries={entries} locale={locale} />
        </Reveal>
      </Container>
    </section>
  )
}
