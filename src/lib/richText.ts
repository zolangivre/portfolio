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

/** Words per minute for reading on screen — a calm, unhurried pace. */
const READING_WORDS_PER_MINUTE = 200

/**
 * Minutes it takes to read `content`, rounded, never under one — or null
 * when there's nothing to read, so the caller can leave the label out.
 */
export function readingMinutes(content: LexicalContent | null | undefined): number | null {
  const text = lexicalToPlainText(content)

  if (!text) {
    return null
  }

  return Math.max(1, Math.round(text.split(' ').length / READING_WORDS_PER_MINUTE))
}

/**
 * The "{minutes} min read" label for `content`, or null when it isn't worth
 * showing: a one-minute read is every short entry, and repeating that on
 * each card says nothing — the label earns its place from two minutes up.
 */
export function readingTimeLabel(
  content: LexicalContent | null | undefined,
  template: string,
): string | null {
  const minutes = readingMinutes(content)

  return minutes && minutes >= 2 ? template.replace('{minutes}', String(minutes)) : null
}

export function lexicalToPlainText(content: LexicalContent | null | undefined): string {
  if (!content?.root?.children) return ''

  const parts: string[] = []
  for (const child of content.root.children) {
    collectPlainText(child as LexicalNode, parts)
  }

  return parts.join('').replace(/\s+/g, ' ').trim()
}
