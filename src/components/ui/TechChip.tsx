import Image from 'next/image'

import { isValidHexColor } from '@/lib/color'
import { getMediaUrl } from '@/lib/media'
import type { Technology } from '@/payload-types'

type TechChipProps = {
  technology: Technology | number
}

const CHIP_CLASSNAME =
  'flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-fg-muted transition hover:scale-105 hover:border-accent-soft-border hover:text-fg'

export function TechChip({ technology }: TechChipProps) {
  const isResolved = typeof technology === 'object' && technology !== null

  if (!isResolved) {
    return (
      <li className={CHIP_CLASSNAME}>
        <span>{technology}</span>
      </li>
    )
  }

  const logoUrl = getMediaUrl(technology.logo)
  const colorDot = isValidHexColor(technology.color) ? technology.color : null

  const content = (
    <>
      {colorDot ? (
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: colorDot }}
        />
      ) : null}
      {logoUrl ? (
        <Image
          alt=""
          className={`h-3.5 w-3.5 shrink-0 rounded-full object-contain${technology.invertLogoInDarkMode ? ' dark:invert' : ''}`}
          height={14}
          src={logoUrl}
          width={14}
        />
      ) : null}
      <span>{technology.name}</span>
    </>
  )

  return (
    <li>
      {technology.website ? (
        <a
          className={CHIP_CLASSNAME}
          href={technology.website}
          rel="noreferrer"
          target="_blank"
        >
          {content}
        </a>
      ) : (
        <span className={CHIP_CLASSNAME}>{content}</span>
      )}
    </li>
  )
}
