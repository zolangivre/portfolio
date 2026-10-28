import Link from 'next/link'
import type { ReactNode } from 'react'

const dateFormat = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Europe/Paris',
})

/**
 * Dates in the admin's language and the owner's time zone. A missing or
 * invalid date shows as a dash: `format` throws on it, and one bad row would
 * take the whole dashboard down.
 */
export const formatDate = (iso: string | null | undefined) => {
  const date = iso ? new Date(iso) : null

  return date && !Number.isNaN(date.getTime()) ? dateFormat.format(date) : '—'
}

export type WidgetRow = { href: string; key: string; meta: ReactNode; title: ReactNode }

/**
 * The frame every dashboard widget shares: a heading, then a list of links
 * into the admin, or a sentence when there is nothing to show. Styled with
 * the admin theme's variables (custom.scss), so it follows its dark mode.
 */
export function WidgetShell({
  aside,
  empty,
  rows,
  title,
}: {
  aside?: ReactNode
  empty: string
  rows: WidgetRow[]
  title: string
}) {
  return (
    <section className="dashboard-widget">
      <header className="dashboard-widget__header">
        <h3 className="dashboard-widget__title">{title}</h3>
        {aside}
      </header>
      {rows.length > 0 ? (
        <ul className="dashboard-widget__list">
          {rows.map((row) => (
            <li key={row.key}>
              <Link className="dashboard-widget__row" href={row.href}>
                <span className="dashboard-widget__row-title">{row.title}</span>
                <span className="dashboard-widget__row-meta">{row.meta}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="dashboard-widget__empty">{empty}</p>
      )}
    </section>
  )
}
