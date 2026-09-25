import Image from 'next/image'
import Link from 'next/link'

import { cardClassName, cardFrameClassName } from '@/components/ui/Card'
import { Pill } from '@/components/ui/Pill'
import type { Dictionary } from '@/lib/i18n/dictionary'
import type { Locale } from '@/lib/locale'
import { getMediaUrl } from '@/lib/media'
import type { Journal } from '@/payload-types'

type JournalCardProps = {
  dictionary: Dictionary
  entry: Journal
  locale: Locale
}

const dateFormatters: Record<Locale, Intl.DateTimeFormat> = {
  fr: new Intl.DateTimeFormat('fr', { day: 'numeric', month: 'long', year: 'numeric' }),
  en: new Intl.DateTimeFormat('en', { day: 'numeric', month: 'long', year: 'numeric' }),
}

export function JournalCard({ dictionary, entry, locale }: JournalCardProps) {
  const imageUrl = getMediaUrl(entry.coverImage)
  const imageAlt =
    typeof entry.coverImage === 'object' && entry.coverImage ? entry.coverImage.alt : entry.title
  const categoryLabel =
    typeof entry.category === 'object' && entry.category ? entry.category.name : null
  const formattedDate = dateFormatters[locale].format(new Date(entry.date))
  const tags = entry.tags ?? []

  return (
    // .card-glow's hover glow lives on an ::after — it needs an ancestor
    // without overflow-hidden (the Link below clips the cover image to its
    // rounded corners, which would clip the glow's shadow too).
    <div className={cardFrameClassName('h-full')}>
      <Link
        className={cardClassName({ className: 'group flex h-full flex-col overflow-hidden' })}
        data-cursor="pointer"
        href={`/${locale}/journal/${entry.slug}`}
      >
        <div className="relative aspect-16/10 overflow-hidden bg-surface">
          {imageUrl ? (
            <Image
              alt={imageAlt}
              className="h-full w-full object-cover"
              height={640}
              sizes="(min-width: 1024px) min(33vw, 375px), (min-width: 720px) 50vw, 100vw"
              src={imageUrl}
              width={960}
            />
          ) : null}
          <div className="absolute inset-0 bg-linear-to-t from-bg/70 via-bg/5 to-transparent" />
          {categoryLabel ? (
            <Pill className="absolute left-4 top-4" tone="floating">
              {categoryLabel}
            </Pill>
          ) : null}
          {entry.featured ? (
            <Pill className="absolute right-4 top-4 backdrop-blur-sm" tone="accent">
              {dictionary.journal.featuredBadge}
            </Pill>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-6 sm:p-7">
          <p className="text-label uppercase text-fg-subtle">
            {formattedDate}
            {entry.location ? ` · ${entry.location}` : null}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-fg">{entry.title}</h3>
          <p className="mt-3 flex-1 text-sm leading-7 text-fg-muted">{entry.shortDescription}</p>

          {tags.length > 0 ? (
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="tags">
              {tags.slice(0, 4).map((tag, index) => (
                <Pill as="li" key={`${tag.value}-${index}`}>
                  {tag.value}
                </Pill>
              ))}
            </ul>
          ) : null}
        </div>
      </Link>
    </div>
  )
}
