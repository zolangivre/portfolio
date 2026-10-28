import { pillClassName } from '@/components/ui/Pill'
import { SafeImage } from '@/components/ui/SafeImage'
import { isValidHexColor } from '@/lib/color'
import { getMediaUrl } from '@/lib/media'
import type { Technology } from '@/payload-types'

type TechChipProps = {
  /** `null` is a technology in the trash: Payload populates it as `null`. */
  technology: Technology | number | null
  /**
   * A name too long for the row ("AWS Elastic Container Service (Fargate)")
   * is cut with an ellipsis by default — cards stay tidy, the full name is
   * in the tooltip and on the project page. `wrap` lets it run onto a second
   * line instead, for that page.
   */
  wrap?: boolean
}

// Only a chip that links somewhere reacts to the pointer; a plain one stays
// still rather than promising a click. `max-w-full` caps a long chip at the
// row's width instead of letting it spill past the card.
const CHIP_CLASSNAME = pillClassName({ className: 'max-w-full' })
const LINK_CHIP_CLASSNAME = pillClassName({ className: 'max-w-full', interactive: true })

/**
 * A relationship's technologies without the ones in the trash, which Payload
 * populates as `null`: a list renders no empty chip for them, and no list at
 * all once they're all gone.
 */
export function presentTechnologies(
  technologies: (Technology | number | null)[] | null | undefined,
): (Technology | number)[] {
  return (technologies ?? []).filter((technology) => technology !== null)
}

export function TechChip({ technology, wrap = false }: TechChipProps) {
  if (technology === null) {
    return null
  }

  const isResolved = typeof technology === 'object'

  if (!isResolved) {
    return (
      <li className={CHIP_CLASSNAME}>
        <span>{technology}</span>
      </li>
    )
  }

  const logoUrl = getMediaUrl(technology.logo)
  // Where the name may be cut, the tooltip keeps it readable.
  const fullName = wrap ? undefined : technology.name
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
        <SafeImage
          alt=""
          className={`h-3.5 w-3.5 shrink-0 rounded-full object-contain${technology.invertLogoInDarkMode ? ' dark:invert' : ''}`}
          height={14}
          src={logoUrl}
          width={14}
        />
      ) : null}
      <span className={wrap ? 'whitespace-normal wrap-anywhere' : 'min-w-0 truncate'}>
        {technology.name}
      </span>
    </>
  )

  return (
    // `flex` so the inline-flex chip is laid out as a flex item, not on a
    // text line — otherwise the li grows by the line-height strut.
    <li className="flex min-w-0 max-w-full">
      {technology.website ? (
        <a
          className={LINK_CHIP_CLASSNAME}
          href={technology.website}
          rel="noreferrer"
          target="_blank"
          title={fullName}
        >
          {content}
        </a>
      ) : (
        <span className={CHIP_CLASSNAME} title={fullName}>
          {content}
        </span>
      )}
    </li>
  )
}
