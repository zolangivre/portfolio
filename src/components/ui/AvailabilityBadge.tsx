import type { Hero } from '@/payload-types'

/**
 * The badge text, or null when it's switched off in Payload (Bannière →
 * Disponibilité) or left empty — an enabled badge with no text would render
 * as a lone green dot.
 */
export function resolveAvailability(hero: Hero | null | undefined): string | null {
  if (!hero?.availability?.enabled) {
    return null
  }

  return hero.availability.label?.trim() || null
}

type AvailabilityBadgeProps = {
  className?: string
  label: string
}

/**
 * "Open to work" signal for recruiters, shown above the hero title. The dot
 * is a fixed green rather than the CMS accent:
 * green-means-available is a convention the reader already knows, whatever
 * accent the site is set to.
 */
export function AvailabilityBadge({ className, label }: AvailabilityBadgeProps) {
  return (
    <p
      className={[
        'inline-flex items-center gap-2 rounded-full border border-border-strong bg-bg-elevated/80 px-3.5 py-1.5 text-caption font-medium text-fg',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
      {label}
    </p>
  )
}
