import { Container } from '@/components/ui/Container'
import type { Dictionary } from '@/lib/i18n/dictionary'
import type { SectionCopy } from '@/lib/sectionCopy'
import type { Category, Skill } from '@/payload-types'

import { SkillCard } from '../cards/SkillCard'
import { RevealGroup } from '../ui/RevealGroup'
import { Shelf } from '../ui/Shelf'
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
          // A grid from 720px; on phones, a row of categories to swipe through.
          <Shelf
            navLabel={dictionary.skills.shelfNavLabel}
            titles={skillGroups.map(({ category }) => category?.name ?? dictionary.skills.eyebrow)}
          >
            <RevealGroup amount={0.01} className="skills-grid shelf">
              {skillGroups.map(({ category, skills: categorySkills }) => (
                <article className="skill-group @container" key={category?.id ?? 'uncategorized'}>
                  <h3 className="text-fg">{category?.name ?? dictionary.skills.eyebrow}</h3>
                  {/* Two tiles to a row only where a name like "TypeScript"
                      fits beside its icon: a 320px phone, or a large text
                      size, gets one. Measured on the card, so it holds in
                      the phone shelf and the desktop grid alike. */}
                  <ul className="mt-4 grid grid-cols-1 gap-3 @min-[17.5rem]:grid-cols-2">
                    {/* No idle bobbing: a few dozen tiles drifting on a 5s loop
                      (0.2 Hz, the rate most likely to unsettle) pulled at the
                      eye while reading. They still answer the pointer. */}
                    {categorySkills.map((skill) => (
                      <li className="block" key={skill.id}>
                        <SkillCard dictionary={dictionary} skill={skill} />
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </RevealGroup>
          </Shelf>
        ) : (
          <p className="empty-state">{dictionary.skills.emptyState}</p>
        )}
      </Container>
    </section>
  )
}
