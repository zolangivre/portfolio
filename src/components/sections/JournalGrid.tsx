'use client'

import { useMemo, useState } from 'react'

import { JournalCard } from '@/components/cards/JournalCard'
import { RevealGroup } from '@/components/ui/RevealGroup'
import type { Dictionary } from '@/lib/i18n/dictionary'
import type { Locale } from '@/lib/locale'
import type { Category, Journal } from '@/payload-types'

type JournalGridProps = {
  dictionary: Dictionary
  entries: Journal[]
  locale: Locale
}

function resolveCategory(entry: Journal): Category | null {
  return typeof entry.category === 'object' && entry.category ? entry.category : null
}

export function JournalGrid({ dictionary, entries, locale }: JournalGridProps) {
  const categories = useMemo(() => {
    const seen = new Map<number, Category>()

    for (const entry of entries) {
      const category = resolveCategory(entry)
      if (category) {
        seen.set(category.id, category)
      }
    }

    return Array.from(seen.values()).sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER
      if (orderA !== orderB) {
        return orderA - orderB
      }
      return a.name.localeCompare(b.name)
    })
  }, [entries])

  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null)

  const visibleEntries = activeCategoryId
    ? entries.filter((entry) => resolveCategory(entry)?.id === activeCategoryId)
    : entries

  return (
    <>
      {categories.length > 1 ? (
        <div className="category-filter" role="group">
          <button
            className="category-filter-item"
            data-active={activeCategoryId === null}
            onClick={() => setActiveCategoryId(null)}
            type="button"
          >
            {dictionary.journal.allCategoriesLabel}
          </button>
          {categories.map((category) => (
            <button
              className="category-filter-item"
              data-active={activeCategoryId === category.id}
              key={category.id}
              onClick={() => setActiveCategoryId(category.id)}
              type="button"
            >
              {category.name}
            </button>
          ))}
        </div>
      ) : null}

      {visibleEntries.length > 0 ? (
        <RevealGroup className="project-grid" scale={0.96}>
          {visibleEntries.map((entry) => (
            <JournalCard dictionary={dictionary} entry={entry} key={entry.id} locale={locale} />
          ))}
        </RevealGroup>
      ) : (
        <p className="empty-state">{dictionary.journal.emptyState}</p>
      )}
    </>
  )
}
