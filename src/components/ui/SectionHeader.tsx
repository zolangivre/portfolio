import type { LexicalContent } from '@/lib/richText'

import { Reveal } from './Reveal'
import { RichText } from './RichText'

type SectionHeaderProps = {
  /** `h1` when the header opens its own page rather than a homepage section. */
  as?: 'h1' | 'h2'
  eyebrow?: string
  id?: string
  title: string
  description?: LexicalContent | null
}

export function SectionHeader({
  as: Heading = 'h2',
  description,
  eyebrow,
  id,
  title,
}: SectionHeaderProps) {
  return (
    <Reveal>
      <div className="section-header">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <Heading id={id}>{title}</Heading>
        {description ? <RichText content={description} /> : null}
      </div>
    </Reveal>
  )
}
