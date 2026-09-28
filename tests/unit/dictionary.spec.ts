import type { SelectField } from 'payload'
import { describe, expect, it } from 'vitest'

import { Projects } from '@/collections/Projects'
import { getDictionary } from '@/lib/i18n/dictionary'
import { locales } from '@/lib/locale'

/**
 * The Dictionary interface already makes TypeScript check both locales, but
 * not inside `Record<string, string>` maps — the contact errors and the
 * project status labels — where a missing key only shows up on the page as
 * a fallback, or as nothing at all.
 */

const keyPaths = (value: unknown, prefix = ''): string[] =>
  value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => keyPaths(child, `${prefix}${key}.`))
    : [prefix.slice(0, -1)]

// Every `error` submitContactForm can return (src/lib/actions/contact.ts).
const CONTACT_ERRORS = ['invalid-email', 'missing-fields', 'server-error']

const statusField = Projects.fields.find(
  (field): field is SelectField => 'name' in field && field.name === 'status',
)!
const statuses = statusField.options.map((option) =>
  typeof option === 'string' ? option : option.value,
)

describe('dictionaries', () => {
  it('have the same keys in every locale', () => {
    const [first, ...rest] = locales.map((locale) => keyPaths(getDictionary(locale)).sort())

    for (const paths of rest) {
      expect(paths).toEqual(first)
    }
  })

  it.each(locales)('%s: have a message for every contact form error', (locale) => {
    expect(Object.keys(getDictionary(locale).contact.errors).sort()).toEqual(CONTACT_ERRORS)
  })

  it.each(locales)('%s: label every project status the CMS offers', (locale) => {
    expect(Object.keys(getDictionary(locale).projects.statusLabels).sort()).toEqual(
      [...statuses].sort(),
    )
  })

  it.each(locales)('%s: have no empty strings', (locale) => {
    const dictionary = getDictionary(locale)
    const empty = keyPaths(dictionary).filter((path) => {
      const value = path.split('.').reduce<unknown>((node, key) => (node as never)[key], dictionary)
      return typeof value === 'string' && value.trim() === ''
    })

    expect(empty).toEqual([])
  })
})
