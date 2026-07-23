import { Container } from '@/components/ui/Container'
import type { Dictionary } from '@/lib/i18n/dictionary'
import type { SectionCopy } from '@/lib/sectionCopy'
import type { Category, Skill } from '@/payload-types'

import { SkillCard } from '../cards/SkillCard'
import { Reveal } from '../ui/Reveal'
import { SectionHeader } from '../ui/SectionHeader'

type SkillsSectionProps = {
  content: SectionCopy
  dictionary: Dictionary
  skills: Skill[]
}

type SkillGroup = {
  category: Category | null
  skills: Skill[]
}

export function SkillsSection({ content, dictionary, skills }: SkillsSectionProps) {
  const groupsById = new Map<number | string, SkillGroup>()

  for (const skill of skills) {
    const category = typeof skill.category === 'object' && skill.category ? skill.category : null
    const key = category?.id ?? 'uncategorized'
    const group = groupsById.get(key) ?? { category, skills: [] }
    group.skills.push(skill)
    groupsById.set(key, group)
  }

  const skillGroups = Array.from(groupsById.values()).sort((a, b) => {
    const orderA = a.category?.order ?? Number.MAX_SAFE_INTEGER
    const orderB = b.category?.order ?? Number.MAX_SAFE_INTEGER
    if (orderA !== orderB) {
      return orderA - orderB
    }
    return (a.category?.name ?? '').localeCompare(b.category?.name ?? '')
  })

  return (
    <section aria-labelledby="skills-title" className="content-section" id="skills">
      <Container>
        <SectionHeader
          description={content.description}
          eyebrow={content.eyebrow}
          id="skills-title"
          title={content.title}
        />

        {skills.length > 0 ? (
          <div className="skills-grid">
            {skillGroups.map(({ category, skills: categorySkills }, groupIndex) => (
              <Reveal delay={Math.min(groupIndex, 5) * 0.08} key={category?.id ?? 'uncategorized'}>
                <article className="skill-group">
                  <h3 className="text-fg">{category?.name ?? dictionary.skills.eyebrow}</h3>
                  <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {categorySkills.map((skill) => (
                      <li key={skill.id}>
                        <SkillCard dictionary={dictionary} skill={skill} />
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="empty-state">{dictionary.skills.emptyState}</p>
        )}
      </Container>
    </section>
  )
}
