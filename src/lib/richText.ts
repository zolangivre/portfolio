// Matches the shape Payload's type generator emits for every richText field.
export type LexicalContent = {
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

type LexicalNode = {
  type?: string
  text?: string
  children?: LexicalNode[]
  [k: string]: unknown
}

export function textToLexicalParagraphs(text: string): LexicalContent {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: text
        .split(/\n+/)
        .map((paragraph) => paragraph.trim())
        .filter((paragraph) => paragraph.length > 0)
        .map((paragraph) => ({
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          textFormat: 0,
          textStyle: '',
          children: [
            {
              type: 'text',
              text: paragraph,
              format: 0,
              style: '',
              mode: 'normal',
              detail: 0,
              version: 1,
            },
          ],
        })),
    },
  }
}

function collectPlainText(node: LexicalNode, parts: string[]): void {
  if (typeof node.text === 'string') {
    parts.push(node.text)
    return
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      collectPlainText(child, parts)
    }
    if (node.type === 'paragraph' || node.type === 'heading' || node.type === 'listitem') {
      parts.push(' ')
    }
  }
}

export function lexicalToPlainText(content: LexicalContent | null | undefined): string {
  if (!content?.root?.children) return ''

  const parts: string[] = []
  for (const child of content.root.children) {
    collectPlainText(child as LexicalNode, parts)
  }

  return parts.join('').replace(/\s+/g, ' ').trim()
}
