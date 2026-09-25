export type ButtonVariant = 'primary' | 'secondary'

const BASE =
  'btn-cta inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition duration-(--duration-base) ease-bounce hover:scale-[1.04] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-fg hover:bg-accent-strong',
  secondary:
    'border border-border-strong bg-surface text-fg hover:border-accent-soft-border hover:text-accent',
}

/**
 * Pill CTA styling (hero, contact form, error/404 pages). A class helper
 * rather than a component because it lands on `<a>`, `Link`, `<button>` and
 * `motion.button`, several of them carrying a magnetic-hover ref.
 * `.btn-cta` (styles.css) adds the press ripple and hover glow.
 */
export function buttonClassName(variant: ButtonVariant = 'primary', className?: string) {
  return [BASE, VARIANTS[variant], className].filter(Boolean).join(' ')
}
