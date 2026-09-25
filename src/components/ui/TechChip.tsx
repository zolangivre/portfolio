import Image from 'next/image'

import { pillClassName } from '@/components/ui/Pill'
import { isValidHexColor } from '@/lib/color'
import { getMediaUrl } from '@/lib/media'
import type { Technology } from '@/payload-types'

type TechChipProps = {
  technology: Technology | number
}

const CHIP_CLASSNAME = pillClassName({ interactive: true })

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
    // `flex` so the inline-flex chip is laid out as a flex item, not on a
    // text line — otherwise the li grows by the line-height strut.
    <li className="flex">
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
