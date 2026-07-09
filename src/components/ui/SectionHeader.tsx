type SectionHeaderProps = {
  eyebrow?: string
  id?: string
  title: string
  description?: string
}

export function SectionHeader({ description, eyebrow, id, title }: SectionHeaderProps) {
  return (
    <div className="section-header">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 id={id}>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  )
}
