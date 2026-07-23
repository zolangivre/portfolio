import Image from 'next/image'

import { getMediaUrl } from '@/lib/media'
import type { Dictionary } from '@/lib/i18n/dictionary'
import type { Skill } from '@/payload-types'

type SkillCardProps = {
  dictionary: Dictionary
  skill: Skill
}

export function SkillCard({ dictionary, skill }: SkillCardProps) {
  const logoUrl = getMediaUrl(skill.logo)

  const content = (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5">
        {logoUrl ? (
          <Image
            alt=""
            className={`skill-card-icon h-6 w-6 shrink-0 object-contain${skill.invertLogoInDarkMode ? ' dark:invert' : ''}`}
            height={24}
            src={logoUrl}
            width={24}
          />
        ) : null}
        <span className="font-medium text-fg">{skill.name}</span>
      </div>

      {skill.url ? (
        <span aria-hidden="true" className="skill-card-link-icon shrink-0">
          <svg
            fill="none"
            height="14"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="14"
          >
            <path d="M7 17 17 7" />
            <path d="M7 7h10v10" />
          </svg>
        </span>
      ) : null}
    </div>
  )

  if (skill.url) {
    return (
      <a className="skill-card" href={skill.url} rel="noopener noreferrer" target="_blank">
        {content}
        <span className="sr-only"> {dictionary.skills.visitAriaLabelSuffix}</span>
      </a>
    )
  }

  return <div className="skill-card">{content}</div>
}
