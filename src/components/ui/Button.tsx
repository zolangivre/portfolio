export type ButtonVariant = 'primary' | 'secondary'

// Deliberately quiet: hover only shifts colour, and the press is the one bit
// of motion — a 100ms dip to 0.97 so the click feels heard. No hover zoom,
// ripple or magnetic pull; a CTA is something to read and act on, not a toy.
const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-[scale,color,background-color,border-color,opacity] duration-(--duration-fast) ease-out-premium active:duration-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-fg hover:bg-accent-strong',
  secondary:
    'border border-border-strong bg-surface text-fg hover:border-accent-soft-border hover:text-accent',
}

/**
 * Pill CTA styling (hero, contact form, error/404 pages). A class helper
 * rather than a component because it lands on `<a>`, `Link`, `<button>` and
 * `motion.button`.
 */
export function buttonClassName(variant: ButtonVariant = 'primary', className?: string) {
  return [BASE, VARIANTS[variant], className].filter(Boolean).join(' ')
}
