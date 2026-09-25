import Image from 'next/image'
import Link from 'next/link'

import { cardClassName, cardFrameClassName } from '@/components/ui/Card'

export type AdjacentItem = {
  href: string
  imageAlt?: string
  imageUrl?: string | null
  darkImageUrl?: string | null
  meta?: string | null
  title: string
}

type AdjacentNavProps = {
  ariaLabel: string
  /**
   * Journal covers are photographs and can be cropped; project covers are
   * often logos or screenshots, which have to stay whole.
   */
  imageFit?: 'contain' | 'cover'
  next?: AdjacentItem | null
  nextLabel: string
  previous?: AdjacentItem | null
  previousLabel: string
}

type AdjacentLinkProps = {
  direction: 'previous' | 'next'
  imageFit: 'contain' | 'cover'
  item: AdjacentItem
  label: string
}

function AdjacentLink({ direction, imageFit, item, label }: AdjacentLinkProps) {
  const isPrevious = direction === 'previous'

  return (
    // Same trick as the cards: the glow lives on an ::after, so it needs a
    // wrapper the Link's rounded/overflow clipping can't reach.
    <div className={cardFrameClassName('h-full')}>
      <Link
        className={cardClassName({
          className: `group flex h-full items-center gap-4 p-4 sm:p-5${
            isPrevious ? '' : ' flex-row-reverse text-right'
          }`,
        })}
        data-cursor="pointer"
        href={item.href}
      >
        {item.imageUrl ? (
          <span
            className={`relative hidden h-16 w-16 shrink-0 overflow-hidden rounded-inset bg-surface sm:block${
              imageFit === 'contain' ? ' p-2' : ''
            }`}
          >
            {item.imageUrl && (
              <Image
                alt={item.imageAlt ?? ''}
                className={`h-full w-full ${imageFit === 'contain' ? 'object-contain' : 'object-cover'} ${item.darkImageUrl ? ' dark:hidden' : ''}`}
                height={128}
                sizes="64px"
                src={item.imageUrl}
                width={128}
              />
            )}
            {item.darkImageUrl && (
              <Image
                alt={item.imageAlt ?? ''}
                className={`h-full w-full ${imageFit === 'contain' ? 'object-contain' : 'object-cover'} dark:block`}
                height={128}
                sizes="64px"
                src={item.darkImageUrl}
                width={128}
              />
            )}
          </span>
        ) : null}

        <span className="min-w-0 flex-1">
          <span
            className={`flex items-center gap-2 text-label uppercase text-fg-subtle ${
              isPrevious ? '' : 'flex-row-reverse'
            }`}
          >
            <span
              aria-hidden
              className={`text-accent transition-transform duration-(--duration-base) ease-bounce ${
                isPrevious ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'
              }`}
            >
              {isPrevious ? '←' : '→'}
            </span>
            {label}
          </span>
          <span className="mt-1.5 line-clamp-2 block text-base font-semibold text-fg transition group-hover:text-accent">
            {item.title}
          </span>
          {item.meta ? (
            <span className="mt-1 line-clamp-1 block text-xs text-fg-muted">{item.meta}</span>
          ) : null}
        </span>
      </Link>
    </div>
  )
}

export function AdjacentNav({
  ariaLabel,
  imageFit = 'cover',
  next,
  nextLabel,
  previous,
  previousLabel,
}: AdjacentNavProps) {
  if (!previous && !next) {
    return null
  }

  return (
    <nav aria-label={ariaLabel} className="mt-10 grid gap-4 sm:grid-cols-2">
      {previous ? (
        <AdjacentLink
          direction="previous"
          imageFit={imageFit}
          item={previous}
          label={previousLabel}
        />
      ) : (
        // Keeps a lone "next" card in the right-hand column.
        <div aria-hidden className="hidden sm:block" />
      )}
      {next ? (
        <AdjacentLink direction="next" imageFit={imageFit} item={next} label={nextLabel} />
      ) : null}
    </nav>
  )
}
