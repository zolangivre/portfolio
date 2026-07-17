import { textToLexicalParagraphs, type LexicalContent } from '@/lib/richText'

export type SectionCopy = {
  eyebrow: string
  title: string
  description: LexicalContent
}

type SectionCopyFallback = {
  eyebrow: string
  title: string
  description: string
}

export function resolveSectionCopy(
  payloadGroup:
    | {
        eyebrow?: string | null
        title?: string | null
        description?: LexicalContent | null
      }
    | null
    | undefined,
  fallback: SectionCopyFallback,
): SectionCopy {
  return {
    eyebrow: payloadGroup?.eyebrow || fallback.eyebrow,
    title: payloadGroup?.title || fallback.title,
    description: payloadGroup?.description ?? textToLexicalParagraphs(fallback.description),
  }
}
