import { RichText as PayloadRichText } from '@payloadcms/richtext-lexical/react'

import type { About, Journal, Project } from '@/payload-types'

type RichTextProps = {
  content: Journal['content'] | NonNullable<Project['description']> | NonNullable<About['body']>
}

export function RichText({ content }: RichTextProps) {
  return <PayloadRichText className="rich-text text-justify" data={content} />
}
