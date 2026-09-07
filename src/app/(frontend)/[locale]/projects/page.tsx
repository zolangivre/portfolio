import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ProjectsGrid } from '@/components/sections/ProjectsGrid'
import { Container } from '@/components/ui/Container'
import { ReadingProgress } from '@/components/ui/ReadingProgress'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { getDictionary } from '@/lib/i18n/dictionary'
import { defaultLocale, locales, type Locale } from '@/lib/locale'
import { getAllProjects, getSectionsVisibility } from '@/lib/queries'
import { textToLexicalParagraphs } from '@/lib/richText'

// Safety net only — see the note in the locale layout. Freshness comes from
// the tag-based revalidation in Payload's afterChange hooks.
export const revalidate = 86400

type PageParams = { locale: string }

function resolveLocale(locale: string): Locale {
  return locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>
}): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const dictionary = getDictionary(resolveLocale(rawLocale))

  return {
    title: dictionary.projects.archiveTitle,
    description: dictionary.projects.archiveDescription,
  }
}

/**
 * The full archive.
 *
 * The homepage keeps its own projects section — it shows the featured subset
 * and links here — so this page is the complete list, and the only place the
 * technology filter lives.
 */
export default async function ProjectsPage({ params }: { params: Promise<PageParams> }) {
  const { locale: rawLocale } = await params
  const locale = resolveLocale(rawLocale)
  const dictionary = getDictionary(locale)

  const sections = await getSectionsVisibility(locale)

  if (sections?.projects === false) {
    notFound()
  }

  const projects = await getAllProjects(locale)

  return (
    <section aria-labelledby="projects-archive-title" className="content-section">
      <ReadingProgress />
      <Container>
        <Reveal>
          <Link
            className="link-underline text-sm font-medium text-fg-muted transition hover:text-accent"
            href={`/${locale}#projects`}
          >
            {dictionary.projects.backToHomeLabel}
          </Link>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-6">
            <SectionHeader
              description={textToLexicalParagraphs(dictionary.projects.archiveDescription)}
              eyebrow={dictionary.projects.archiveEyebrow}
              id="projects-archive-title"
              title={dictionary.projects.archiveTitle}
            />
            <ProjectsGrid dictionary={dictionary} locale={locale} projects={projects} />
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
