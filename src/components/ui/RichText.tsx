import { RichText as PayloadRichText } from '@payloadcms/richtext-lexical/react'

// Matches the shape Payload's type generator emits for every richText field.
type LexicalContent = {
  root: {
    type: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches Payload's generated richText field shape
    children: { type: any; version: number; [k: string]: unknown }[]
    direction: ('ltr' | 'rtl') | null
    format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | ''
    indent: number
    version: number
  }
  [k: string]: unknown
}

type RichTextProps = {
  content: LexicalContent
}

export function RichText({ content }: RichTextProps) {
  return <PayloadRichText className="rich-text" data={content} />
}
