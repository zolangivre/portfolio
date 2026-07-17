import type { LexicalContent } from '@/lib/richText'

import { RichText } from './RichText'

type SectionHeaderProps = {
  eyebrow?: string
  id?: string
  title: string
  description?: LexicalContent | null
}

export function SectionHeader({ description, eyebrow, id, title }: SectionHeaderProps) {
  return (
    <div className="section-header">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 id={id}>{title}</h2>
      {description ? <RichText content={description} /> : null}
    </div>
  )
}
