export type SectionCopy = {
  eyebrow: string
  title: string
  description: string
}

type SectionCopyField = string | null | undefined

export function resolveSectionCopy(
  payloadGroup:
    | {
        eyebrow?: SectionCopyField
        title?: SectionCopyField
        description?: SectionCopyField
      }
    | null
    | undefined,
  fallback: SectionCopy,
): SectionCopy {
  return {
    eyebrow: payloadGroup?.eyebrow || fallback.eyebrow,
    title: payloadGroup?.title || fallback.title,
    description: payloadGroup?.description || fallback.description,
  }
}
