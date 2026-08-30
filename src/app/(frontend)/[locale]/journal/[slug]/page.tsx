import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AdjacentNav } from '@/components/ui/AdjacentNav'
import { AnimatedTitle } from '@/components/ui/AnimatedTitle'
import { Container } from '@/components/ui/Container'
import { Divider } from '@/components/ui/Divider'
import { FadeImage } from '@/components/ui/FadeImage'
import { MediaGallery } from '@/components/ui/MediaGallery'
import { ReadingProgress } from '@/components/ui/ReadingProgress'
import { Reveal } from '@/components/ui/Reveal'
import { RichText } from '@/components/ui/RichText'
import { getAdjacentBySlug } from '@/lib/adjacent'
import { getDictionary } from '@/lib/i18n/dictionary'
import { defaultLocale, locales, type Locale } from '@/lib/locale'
import { getMediaUrl } from '@/lib/media'
import { getJournalEntries, getJournalEntry, getSectionsVisibility } from '@/lib/queries'
import type { Media } from '@/payload-types'

// Safety net only — see the note in the locale layout. Freshness comes from
// the tag-based revalidation in Payload's afterChange hooks.
export const revalidate = 86400

type PageParams = { locale: string; slug: string }

function resolveLocale(locale: string): Locale {
  return locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale
}

const dateFormatters: Record<Locale, Intl.DateTimeFormat> = {
  fr: new Intl.DateTimeFormat('fr', { day: 'numeric', month: 'long', year: 'numeric' }),
  en: new Intl.DateTimeFormat('en', { day: 'numeric', month: 'long', year: 'numeric' }),
}

export async function generateStaticParams() {
  const params: PageParams[] = []

  for (const locale of locales) {
    const entries = await getJournalEntries(locale)
    for (const entry of entries) {
      params.push({ locale, slug: entry.slug })
    }
  }

  return params
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params
  const locale = resolveLocale(rawLocale)
  const entry = await getJournalEntry(slug, locale)

  if (!entry) {
    return {}
  }

  const imageUrl = getMediaUrl(entry.coverImage)

  return {
    title: entry.meta?.title || entry.title,
    description: entry.meta?.description || entry.shortDescription,
    openGraph: imageUrl ? { images: [{ url: imageUrl }] } : undefined,
  }
}

export default async function JournalEntryPage({ params }: { params: Promise<PageParams> }) {
  const { locale: rawLocale, slug } = await params
  const locale = resolveLocale(rawLocale)
  const dictionary = getDictionary(locale)
  const sections = await getSectionsVisibility(locale)

  if (sections?.journal === false) {
    notFound()
  }

  const entry = await getJournalEntry(slug, locale)

  if (!entry) {
    notFound()
  }

  const imageUrl = getMediaUrl(entry.coverImage)
  const coverImage = typeof entry.coverImage === 'object' ? entry.coverImage : null
  const imageAlt = coverImage ? coverImage.alt : entry.title
  const categoryLabel =
    typeof entry.category === 'object' && entry.category ? entry.category.name : null
  const formattedDate = dateFormatters[locale].format(new Date(entry.date))
  const gallery = (entry.gallery ?? []).filter(
    (item): item is Media => typeof item === 'object' && item !== null,
  )

  // Same query — and so the same order — as the journal index, so "previous"
  // and "next" match the list the visitor came from.
  const { previous, next } = getAdjacentBySlug(await getJournalEntries(locale), entry.slug)
  const toAdjacentItem = (adjacent: typeof previous) =>
    adjacent
      ? {
          href: `/${locale}/journal/${adjacent.slug}`,
          imageAlt:
            typeof adjacent.coverImage === 'object' && adjacent.coverImage
              ? adjacent.coverImage.alt
              : adjacent.title,
          imageUrl: getMediaUrl(adjacent.coverImage),
          meta: dateFormatters[locale].format(new Date(adjacent.date)),
          title: adjacent.title,
        }
      : null

  return (
    <article className="content-section">
      <ReadingProgress />
      <Container>
        <Reveal>
          <Link
            className="link-underline text-sm font-medium text-fg-muted transition hover:text-accent"
            href={`/${locale}/journal`}
          >
            {dictionary.journal.backLabel}
          </Link>
        </Reveal>

        <Reveal delay={0.08}>
          <div>
            {categoryLabel ? <p className="eyebrow mt-6">{categoryLabel}</p> : null}
            <AnimatedTitle title={entry.title} />
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-fg-subtle">
              {formattedDate}
              {entry.location ? ` · ${entry.location}` : null}
            </p>
          </div>
        </Reveal>

        {imageUrl ? (
          <Reveal delay={0.16}>
            <FadeImage
              alt={imageAlt}
              className="mt-8 block h-auto w-full rounded-[28px] bg-surface"
              height={coverImage?.height ?? 900}
              priority
              sizes="(min-width: 1200px) 1160px, 100vw"
              src={imageUrl}
              width={coverImage?.width ?? 1600}
            />
          </Reveal>
        ) : null}

        <Divider />

        <Reveal>
          <RichText content={entry.content} />
        </Reveal>

        {entry.tags && entry.tags.length > 0 ? (
          <Reveal>
            <ul className="mt-8 flex flex-wrap gap-2" aria-label="tags">
              {entry.tags.map((tag, index) => (
                <li
                  className="rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-fg-muted transition hover:scale-105 hover:border-accent-soft-border hover:text-fg"
                  key={`${tag.value}-${index}`}
                >
                  {tag.value}
                </li>
              ))}
            </ul>
          </Reveal>
        ) : null}

        {gallery.length > 0 ? (
          <>
            <Divider />
            <Reveal>
              <MediaGallery
                closeLabel={dictionary.lightbox.closeLabel}
                images={gallery.map((media) => ({
                  id: media.id,
                  src: getMediaUrl(media) ?? '',
                  alt: media.alt,
                  mimeType: media.mimeType,
                  width: media.width ?? undefined,
                  height: media.height ?? undefined,
                }))}
                nextLabel={dictionary.lightbox.nextLabel}
                previousLabel={dictionary.lightbox.previousLabel}
              />
            </Reveal>
          </>
        ) : null}

        {previous || next ? (
          <>
            <Divider />
            <Reveal>
              <AdjacentNav
                ariaLabel={dictionary.journal.adjacentNavAriaLabel}
                next={toAdjacentItem(next)}
                nextLabel={dictionary.journal.nextEntryLabel}
                previous={toAdjacentItem(previous)}
                previousLabel={dictionary.journal.previousEntryLabel}
              />
            </Reveal>
          </>
        ) : null}
      </Container>
    </article>
  )
}
