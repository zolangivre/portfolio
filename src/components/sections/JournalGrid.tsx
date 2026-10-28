'use client'

import { motion } from 'motion/react'
import { useMemo, useState } from 'react'

import { JournalCard } from '@/components/cards/JournalCard'
import { RevealGroup } from '@/components/ui/RevealGroup'
import type { Dictionary } from '@/lib/i18n/dictionary'
import type { Locale } from '@/lib/locale'
import { compareOrderKeys } from '@/lib/order'
import { springPlayful } from '@/lib/motion/tokens'
import type { Category, Journal } from '@/payload-types'

type JournalGridProps = {
  dictionary: Dictionary
  entries: Journal[]
  locale: Locale
}

/**
 * The accent pill behind the active filter: one element (shared layoutId)
 * that glides from the old choice to the new one, instead of one button
 * going dark while another lights up.
 */
function ActivePill() {
  return (
    <motion.span
      aria-hidden="true"
      className="category-filter-active"
      layoutId="journal-filter-active"
      transition={springPlayful}
    />
  )
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

    return Array.from(seen.values()).sort(
      (a, b) => compareOrderKeys(a._order, b._order) || a.name.localeCompare(b.name),
    )
  }, [entries])

  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null)

  const visibleEntries = activeCategoryId
    ? entries.filter((entry) => resolveCategory(entry)?.id === activeCategoryId)
    : entries

  return (
    <>
      {categories.length > 1 ? (
        <div aria-label={dictionary.journal.filterAriaLabel} className="category-filter" role="group">
          <button
            aria-pressed={activeCategoryId === null}
            className="category-filter-item"
            data-active={activeCategoryId === null}
            onClick={() => setActiveCategoryId(null)}
            type="button"
          >
            {activeCategoryId === null ? <ActivePill /> : null}
            {dictionary.journal.allCategoriesLabel}
          </button>
          {categories.map((category) => (
            <button
              aria-pressed={activeCategoryId === category.id}
              className="category-filter-item"
              data-active={activeCategoryId === category.id}
              key={category.id}
              onClick={() => setActiveCategoryId(category.id)}
              type="button"
            >
              {activeCategoryId === category.id ? <ActivePill /> : null}
              {category.name}
            </button>
          ))}
        </div>
      ) : null}

      {visibleEntries.length > 0 ? (
        <RevealGroup className="project-grid" layout scale={0.96}>
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
