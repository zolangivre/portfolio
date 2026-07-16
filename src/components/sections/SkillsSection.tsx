import Image from 'next/image'

import { Container } from '@/components/ui/Container'
import { getMediaUrl } from '@/lib/media'
import type { Dictionary } from '@/lib/i18n/dictionary'
import type { SectionCopy } from '@/lib/sectionCopy'
import type { Category, Skill } from '@/payload-types'

import { SectionHeader } from '../ui/SectionHeader'

type SkillsSectionProps = {
  content: SectionCopy
  dictionary: Dictionary
  skills: Skill[]
}

const LEVEL_RANK: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
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
            {skillGroups.map(({ category, skills: categorySkills }) => (
              <article className="skill-group" key={category?.id ?? 'uncategorized'}>
                <h3 className="text-fg">{category?.name ?? dictionary.skills.eyebrow}</h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {categorySkills.map((skill) => {
                    const logoUrl = getMediaUrl(skill.logo)
                    const levelRank = skill.level ? LEVEL_RANK[skill.level] : undefined
                    const levelLabel = skill.level
                      ? (dictionary.skills.levelLabels[skill.level] ?? skill.level)
                      : null

                    return (
                      <li
                        className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-sm text-fg-muted"
                        key={skill.id}
                      >
                        {logoUrl ? (
                          <Image
                            alt={skill.name}
                            className={`h-4 w-4 shrink-0 rounded-full object-contain${skill.invertLogoInDarkMode ? ' dark:invert' : ''}`}
                            height={16}
                            src={logoUrl}
                            width={16}
                          />
                        ) : null}
                        <span>{skill.name}</span>
                        {levelRank ? (
                          <span aria-label={levelLabel ?? undefined} className="skill-level">
                            {[1, 2, 3].map((dot) => (
                              <span
                                className="skill-level-dot"
                                data-filled={dot <= levelRank}
                                key={dot}
                              />
                            ))}
                          </span>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">{dictionary.skills.emptyState}</p>
        )}
      </Container>
    </section>
  )
}
