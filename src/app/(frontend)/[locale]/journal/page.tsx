import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { JournalGrid } from '@/components/sections/JournalGrid'
import { Container } from '@/components/ui/Container'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { getDictionary } from '@/lib/i18n/dictionary'
import { defaultLocale, locales, type Locale } from '@/lib/locale'
import { getJournalEntries, getSectionsContent, getSectionsVisibility } from '@/lib/queries'
import { lexicalToPlainText } from '@/lib/richText'
import { resolveSectionCopy } from '@/lib/sectionCopy'
import { ReadingProgress } from '@/components/ui/ReadingProgress'

export const revalidate = 60

type PageParams = { locale: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>
}): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale: Locale = locales.includes(rawLocale as Locale)
    ? (rawLocale as Locale)
    : defaultLocale
  const dictionary = getDictionary(locale)
  const sectionsContent = await getSectionsContent(locale)
  const content = resolveSectionCopy(sectionsContent?.journal, dictionary.journal)

  return {
    title: content.title,
    description: lexicalToPlainText(content.description),
  }
}

export default async function JournalPage({ params }: { params: Promise<PageParams> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = locales.includes(rawLocale as Locale)
    ? (rawLocale as Locale)
    : defaultLocale
  const dictionary = getDictionary(locale)

  const sections = await getSectionsVisibility(locale)

  if (sections?.journal === false) {
    notFound()
  }

  const [entries, sectionsContent] = await Promise.all([
    getJournalEntries(locale),
    getSectionsContent(locale),
  ])
  const content = resolveSectionCopy(sectionsContent?.journal, dictionary.journal)

  return (
    <section aria-labelledby="journal-title" className="content-section">
      <ReadingProgress />
      <Container>
        <Reveal>
          <SectionHeader
            description={content.description}
            eyebrow={content.eyebrow}
            id="journal-title"
            title={content.title}
          />
          <JournalGrid dictionary={dictionary} entries={entries} locale={locale} />
        </Reveal>
      </Container>
    </section>
  )
}
