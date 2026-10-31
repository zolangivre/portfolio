import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { ViewTransition } from 'react'

import { AdjacentNav } from '@/components/ui/AdjacentNav'
import { AnimatedTitle } from '@/components/ui/AnimatedTitle'
import { Container } from '@/components/ui/Container'
import { JsonLd } from '@/components/seo/JsonLd'
import { Divider } from '@/components/ui/Divider'
import { FadeImage } from '@/components/ui/FadeImage'
import { MediaGallery } from '@/components/ui/MediaGallery'
import { Pill } from '@/components/ui/Pill'
import { ReadingProgress } from '@/components/ui/ReadingProgress'
import { Reveal } from '@/components/ui/Reveal'
import { RichText } from '@/components/ui/RichText'
import { getAdjacentBySlug } from '@/lib/adjacent'
import { getDictionary } from '@/lib/i18n/dictionary'
import { defaultLocale, locales, type Locale } from '@/lib/locale'
import { getMediaUrl, placeholderProps } from '@/lib/media'
import { readingTimeLabel } from '@/lib/richText'
import {
  getGlobalSettings,
  getJournalEntries,
  getJournalEntry,
  getRedirectDestination,
  getSectionsVisibility,
} from '@/lib/queries'
import { journalJsonLd, pageMetadata } from '@/lib/seo'
import type { Media } from '@/payload-types'

// Safety net only — see the note in the locale layout. Freshness comes from
// the tag-based revalidation in Payload's afterChange hooks.
export const revalidate = 86400

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

type PageParams = { locale: string; slug: string }

function resolveLocale(locale: string): Locale {
  return locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale
}

// Pinned to UTC: the date is a stored calendar day, and formatting it in
// the visitor's own time zone can land on the day before or after — and
// differ from the server render this has to hydrate against.
const dateFormatters: Record<Locale, Intl.DateTimeFormat> = {
  fr: new Intl.DateTimeFormat('fr', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  }),
  en: new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  }),
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
  const [entry, settings] = await Promise.all([
    getJournalEntry(slug, locale),
    getGlobalSettings(locale),
  ])

  if (!entry) {
    return {}
  }

  // The share image comes from `opengraph-image.tsx`: the SEO tab's image or
  // the cover photo, under the entry's title.
  return pageMetadata({
    description: entry.meta?.description || entry.shortDescription,
    locale,
    path: `/journal/${entry.slug}`,
    publishedTime: entry.date,
    siteName: settings?.seo?.defaultTitle,
    title: entry.meta?.title || entry.title,
    type: 'article',
  })
}

export default async function JournalEntryPage({ params }: { params: Promise<PageParams> }) {
  const { locale: rawLocale, slug } = await params
  const locale = resolveLocale(rawLocale)
  const dictionary = getDictionary(locale)
  const [sections, settings] = await Promise.all([
    getSectionsVisibility(locale),
    getGlobalSettings(locale),
  ])

  if (sections?.journal === false) {
    notFound()
  }

  const entry = await getJournalEntry(slug, locale)

  if (!entry) {
    // An old URL of a renamed or removed entry may have a redirect.
    const destination = await getRedirectDestination(`/${locale}/journal/${slug}`)
    if (destination) permanentRedirect(destination)
    notFound()
  }

  const imageUrl = getMediaUrl(entry.coverImage)
  const coverImage = typeof entry.coverImage === 'object' ? entry.coverImage : null
  const imageAlt = coverImage ? coverImage.alt : entry.title
  const categoryLabel =
    typeof entry.category === 'object' && entry.category ? entry.category.name : null
  const formattedDate = dateFormatters[locale].format(new Date(entry.date))
  const readingTime = readingTimeLabel(entry.content, dictionary.journal.readingTime)
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
          transitionName: `journal-media-${adjacent.slug}`,
        }
      : null

  return (
    // Previous/next slide the page in the direction of travel (the
    // links carry nav-back / nav-forward); any other way in keeps the
    // usual cross-fade.
    <ViewTransition
      default="none"
      enter={{ 'nav-back': 'nav-back', 'nav-forward': 'nav-forward', default: 'none' }}
      exit={{ 'nav-back': 'nav-back', 'nav-forward': 'nav-forward', default: 'none' }}
    >
      <article className="content-section">
        <JsonLd
          data={journalJsonLd({
            authorName: settings?.name,
            date: entry.date,
            description: entry.meta?.description || entry.shortDescription,
            imageUrl: getMediaUrl(entry.meta?.image) ?? imageUrl,
            locale,
            siteUrl,
            slug: entry.slug,
            title: entry.title,
            updatedAt: entry.updatedAt,
          })}
        />
        <ReadingProgress />
        <Container>
          <Reveal>
            <Link
              className="link-underline text-sm font-medium text-fg-muted transition hover:text-accent"
              // Back to this entry's own card, which the cover morphs back into.
              href={`/${locale}/journal#entry-${entry.slug}`}
            >
              {dictionary.journal.backLabel}
            </Link>
          </Reveal>

          <Reveal delay={0.08}>
            <div>
              {categoryLabel ? <p className="eyebrow mt-6">{categoryLabel}</p> : null}
              <AnimatedTitle title={entry.title} />
              <p className="text-sm font-medium uppercase tracking-label text-fg-subtle">
                {formattedDate}
                {entry.location ? ` · ${entry.location}` : null}
                {readingTime ? ` · ${readingTime}` : null}
              </p>
            </div>
          </Reveal>

          {/* Not wrapped in <Reveal>: the card's cover lands here (named as in
            JournalCard), and a view transition snapshots it as the page
            commits — mid-fade, it would morph into an empty box. */}
          {imageUrl ? (
            <ViewTransition default="none" name={`journal-media-${entry.slug}`} share="media-morph">
              <FadeImage
                {...placeholderProps(coverImage)}
                alt={imageAlt}
                // Never taller than 70% of the screen: whole on a laptop, the
                // width shrinking to keep the photo's proportions, centred.
                className="mx-auto mt-8 block h-auto max-h-[70svh] w-auto max-w-full rounded-card bg-surface"
                height={coverImage?.height ?? 900}
                priority
                sizes="(min-width: 1200px) 1160px, 100vw"
                src={imageUrl}
                width={coverImage?.width ?? 1600}
              />
            </ViewTransition>
          ) : null}

          <Divider />

          <Reveal>
            <RichText content={entry.content} />
          </Reveal>

          {entry.tags && entry.tags.length > 0 ? (
            <Reveal>
              <ul
                className="mt-8 flex flex-wrap gap-2"
                aria-label={dictionary.journal.tagsAriaLabel}
              >
                {entry.tags.map((tag, index) => (
                  <Pill as="li" key={`${tag.value}-${index}`}>
                    {tag.value}
                  </Pill>
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
                    id: `media-${media.id}`,
                    src: getMediaUrl(media) ?? '',
                    alt: media.alt,
                    mimeType: media.mimeType,
                    placeholder: 'placeholder' in media ? media.placeholder : null,
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
    </ViewTransition>
  )
}
