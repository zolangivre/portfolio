'use client'

import { useTypewriter } from '@/hooks/useTypewriter'

type AnimatedTitleProps = {
  title: string
}

/**
 * Reuses the homepage Hero's title entrance (character-by-character
 * typewriter + blinking cursor, src/hooks/useTypewriter.ts) on a plain `h1`
 * — no `id`/class beyond what the caller already had, so it keeps inheriting
 * the ordinary h1 rule in styles.css rather than Hero's special
 * `#hero-title` display-font override. Used by project/journal detail pages,
 * which already wrap this in their own `<Reveal>` for the section entrance.
 */
export function AnimatedTitle({ title }: AnimatedTitleProps) {
  const typedLength = useTypewriter(title)

  return (
    <h1 aria-label={title}>
      <span aria-hidden="true">
        {title.slice(0, typedLength)}
        <span className="hero-title-cursor" />
      </span>
    </h1>
  )
}
