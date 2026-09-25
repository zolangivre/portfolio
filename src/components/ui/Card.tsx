export type CardTone = 'default' | 'accent'

const TONES: Record<CardTone, { base: string; hover: string }> = {
  default: {
    base: 'border-border bg-bg-elevated shadow-rest',
    hover: 'group-hover/card:border-accent-soft-border group-has-focus-visible/card:border-accent-soft-border',
  },
  accent: {
    base: 'border-accent-soft-border bg-accent-soft',
    hover: 'group-hover/card:border-accent-strong group-has-focus-visible/card:border-accent-strong',
  },
}

/**
 * The static wrapper of an interactive card: it's the hover target, hosts
 * the glow (`.card-glow::after`) and stays put while the card inside lifts.
 * Pair it with `cardClassName()` on the child — see `.card-glow` in
 * styles.css for why the two are split.
 */
export function cardFrameClassName(className?: string) {
  return ['group/card card-glow rounded-card', className].filter(Boolean).join(' ')
}

/**
 * The visible card surface. `interactive` (default) adds the lift and the
 * hover/focus border, keyed off a `cardFrameClassName()` parent; pass
 * `false` for a static panel that should just look like a card.
 */
export function cardClassName({
  className,
  interactive = true,
  tone = 'default',
}: { className?: string; interactive?: boolean; tone?: CardTone } = {}) {
  const { base, hover } = TONES[tone]
  return ['rounded-card border', base, interactive && `card-lift ${hover}`, className]
    .filter(Boolean)
    .join(' ')
}
