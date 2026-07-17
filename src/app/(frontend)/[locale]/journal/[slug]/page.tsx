import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Container } from '@/components/ui/Container'
import { MediaGallery } from '@/components/ui/MediaGallery'
import { Reveal } from '@/components/ui/Reveal'
import { RichText } from '@/components/ui/RichText'
import { getDictionary } from '@/lib/i18n/dictionary'
import { defaultLocale, locales, type Locale } from '@/lib/locale'
import { getMediaUrl } from '@/lib/media'
import { getJournalEntries, getJournalEntry, getSectionsVisibility } from '@/lib/queries'
import type { Media } from '@/payload-types'

export const revalidate = 60

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

  return (
    <article className="content-section">
      <Container>
        <Reveal>
          <Link
            className="text-sm font-medium text-fg-muted transition hover:text-accent"
            href={`/${locale}/journal`}
          >
            {dictionary.journal.backLabel}
          </Link>

          {categoryLabel ? <p className="eyebrow mt-6">{categoryLabel}</p> : null}
          <h1>{entry.title}</h1>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-fg-subtle">
            {formattedDate}
            {entry.location ? ` · ${entry.location}` : null}
          </p>

          {imageUrl ? (
            <Image
              alt={imageAlt}
              className="mt-8 block h-auto w-full rounded-[28px] bg-surface"
              height={coverImage?.height ?? 900}
              priority
              src={imageUrl}
              width={coverImage?.width ?? 1600}
            />
          ) : null}

          <div className="mt-10">
            <RichText content={entry.content} />
          </div>

          {entry.tags && entry.tags.length > 0 ? (
            <ul className="mt-8 flex flex-wrap gap-2" aria-label="tags">
              {entry.tags.map((tag, index) => (
                <li
                  className="rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-fg-muted"
                  key={`${tag.value}-${index}`}
                >
                  {tag.value}
                </li>
              ))}
            </ul>
          ) : null}

          {gallery.length > 0 ? (
            <MediaGallery
              closeLabel={dictionary.lightbox.closeLabel}
              images={gallery.map((media) => ({
                id: media.id,
                src: getMediaUrl(media) ?? '',
                alt: media.alt,
                width: media.width ?? undefined,
                height: media.height ?? undefined,
              }))}
              nextLabel={dictionary.lightbox.nextLabel}
              previousLabel={dictionary.lightbox.previousLabel}
            />
          ) : null}
        </Reveal>
      </Container>
    </article>
  )
}
