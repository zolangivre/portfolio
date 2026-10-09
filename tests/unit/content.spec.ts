import { describe, expect, it } from 'vitest'

import { getAdjacentBySlug } from '@/lib/adjacent'
import { isValidHexColor } from '@/lib/color'
import { extractSectionKey, resolveNavHref } from '@/lib/nav'
import { lexicalToPlainText, textToLexicalParagraphs } from '@/lib/richText'
import { resolveSectionCopy } from '@/lib/sectionCopy'

describe('rich text', () => {
  it('turns each non-empty line into a paragraph', () => {
    const content = textToLexicalParagraphs('First line\n\n  Second line  \n\n\n')

    expect(content.root.children).toHaveLength(2)
    expect(lexicalToPlainText(content)).toBe('First line Second line')
  })

  it('separates headings and list items when flattening', () => {
    const content = {
      root: {
        children: [
          { children: [{ text: 'Title' }], type: 'heading', version: 1 },
          {
            children: [
              { children: [{ text: 'one' }], type: 'listitem' },
              { children: [{ text: 'two' }], type: 'listitem' },
            ],
            type: 'list',
            version: 1,
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    } as Parameters<typeof lexicalToPlainText>[0]

    expect(lexicalToPlainText(content)).toBe('Title one two')
  })

  it('returns an empty string for missing content', () => {
    expect(lexicalToPlainText(null)).toBe('')
    expect(lexicalToPlainText(undefined)).toBe('')
  })
})

describe('resolveSectionCopy', () => {
  const fallback = {
    description: 'Fallback description.',
    eyebrow: 'Fallback eyebrow',
    title: 'Fallback title',
  }

  it('prefers what the CMS provides', () => {
    const description = textToLexicalParagraphs('CMS description.')

    expect(
      resolveSectionCopy({ description, eyebrow: 'CMS eyebrow', title: 'CMS title' }, fallback),
    ).toEqual({
      description,
      eyebrow: 'CMS eyebrow',
      title: 'CMS title',
    })
  })

  it('falls back field by field, including on empty strings', () => {
    const copy = resolveSectionCopy({ eyebrow: '', title: 'CMS title' }, fallback)

    expect(copy.eyebrow).toBe('Fallback eyebrow')
    expect(copy.title).toBe('CMS title')
    expect(lexicalToPlainText(copy.description)).toBe('Fallback description.')
  })

  it('falls back entirely when the group is missing', () => {
    expect(resolveSectionCopy(null, fallback).title).toBe('Fallback title')
  })
})

describe('navigation hrefs', () => {
  it.each([
    ['#projects', '/fr#projects'],
    ['/fr/journal', '/fr/journal'],
    ['https://github.com/zolan', 'https://github.com/zolan'],
  ])('resolves %s to %s', (href, expected) => {
    expect(resolveNavHref('fr', href)).toBe(expected)
  })

  it.each([
    ['#projects', 'projects'],
    ['#Contact', 'contact'],
    ['#unknown', null],
    ['/fr/journal', null],
    ['https://example.com#about', null],
  ])('maps %s to section %s', (href, expected) => {
    expect(extractSectionKey(href)).toBe(expected)
  })
})

describe('getAdjacentBySlug', () => {
  const items = [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }]

  it.each([
    ['a', null, 'b'],
    ['b', 'a', 'c'],
    ['c', 'b', null],
    ['missing', null, null],
  ])('around %s: previous %s, next %s', (slug, previous, next) => {
    const result = getAdjacentBySlug(items, slug)

    expect(result.previous?.slug ?? null).toBe(previous)
    expect(result.next?.slug ?? null).toBe(next)
  })
})

describe('isValidHexColor', () => {
  it.each(['#fff', '#FFFF', '#a1b2c3', '#a1b2c3d4'])('accepts %s', (value) => {
    expect(isValidHexColor(value)).toBe(true)
  })

  it.each(['fff', '#ff', '#abcde', '#ggg', 'red', '', null, undefined])('rejects %j', (value) => {
    expect(isValidHexColor(value)).toBe(false)
  })
})
