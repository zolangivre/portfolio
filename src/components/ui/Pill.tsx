import type { ReactNode } from 'react'

export type PillTone = 'accent' | 'neutral' | 'floating'

const BASE =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-label uppercase'

const TONES: Record<PillTone, string> = {
  accent: 'border-accent-soft-border bg-accent-soft text-accent',
  neutral: 'border-border bg-surface text-fg-muted',
  // Sits on top of a cover image, so it needs an opaque-ish backing.
  floating: 'border-accent-soft-border bg-bg-elevated/90 text-accent backdrop-blur-sm',
}

const INTERACTIVE = 'transition hover:scale-105 hover:border-accent-soft-border hover:text-fg'

type PillOptions = {
  className?: string
  interactive?: boolean
  tone?: PillTone
}

/**
 * The one pill/badge style: tech chips, tags, dates, "featured" and
 * category badges. Uppercase `text-label` type throughout.
 */
export function pillClassName({ className, interactive = false, tone = 'neutral' }: PillOptions = {}) {
  return [BASE, TONES[tone], interactive && INTERACTIVE, className].filter(Boolean).join(' ')
}

type PillProps = PillOptions & {
  as?: 'span' | 'li'
  children: ReactNode
}

export function Pill({ as: Tag = 'span', children, ...options }: PillProps) {
  return <Tag className={pillClassName(options)}>{children}</Tag>
}
