import Image from 'next/image'
import Link from 'next/link'

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
    <Link
      className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-border bg-bg-elevated shadow-lg shadow-black/5 transition duration-300 hover:-translate-y-1 hover:border-accent-soft-border hover:shadow-xl"
      href={`/${locale}/journal/${entry.slug}`}
    >
      <div className="relative aspect-16/10 overflow-hidden bg-surface">
        {imageUrl ? (
          <Image
            alt={imageAlt}
            className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.03]"
            height={640}
            src={imageUrl}
            width={960}
          />
        ) : null}
        <div className="absolute inset-0 bg-linear-to-t from-bg/70 via-bg/5 to-transparent" />
        {categoryLabel ? (
          <span className="absolute left-4 top-4 rounded-full border border-accent-soft-border bg-bg-elevated/90 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-accent backdrop-blur-sm">
            {categoryLabel}
          </span>
        ) : null}
        {entry.featured ? (
          <span className="absolute right-4 top-4 rounded-full border border-accent-soft-border bg-accent-soft px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.28em] text-accent backdrop-blur-sm">
            {dictionary.journal.featuredBadge}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-fg-subtle">
          {formattedDate}
          {entry.location ? ` · ${entry.location}` : null}
        </p>
        <h3 className="mt-2 text-xl font-semibold text-fg">{entry.title}</h3>
        <p className="mt-3 flex-1 text-sm leading-7 text-fg-muted">{entry.shortDescription}</p>

        {tags.length > 0 ? (
          <ul className="mt-5 flex flex-wrap gap-2" aria-label="tags">
            {tags.slice(0, 4).map((tag, index) => (
              <li
                className="rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-fg-muted"
                key={`${tag.value}-${index}`}
              >
                {tag.value}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Link>
  )
}
