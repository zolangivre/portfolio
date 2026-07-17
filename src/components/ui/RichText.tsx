import { RichText as PayloadRichText } from '@payloadcms/richtext-lexical/react'

import type { LexicalContent } from '@/lib/richText'

type RichTextProps = {
  content: LexicalContent
}

export function RichText({ content }: RichTextProps) {
  return <PayloadRichText className="rich-text" data={content} />
}
