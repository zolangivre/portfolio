'use client'

import { usePathname } from 'next/navigation'
import { useSyncExternalStore } from 'react'

import { buttonClassName } from '@/components/ui/Button'

const subscribe = () => () => {}

/**
 * Tells an editor that the site shows drafts, and lets them leave Draft Mode.
 * Hidden inside the admin's Live Preview iframe, where it is noise: there,
 * the admin already says what is being previewed.
 *
 * The pill floats over the bottom of the page, so it brings its own room:
 * padding under the footer and a matching scroll padding, so the footer and a
 * focused contact-form button never end up under it.
 */
export function PreviewBanner({ exitLabel, label }: { exitLabel: string; label: string }) {
  const pathname = usePathname()
  const inFrame = useSyncExternalStore(
    subscribe,
    () => window.self !== window.top,
    () => true,
  )

  if (inFrame) {
    return null
  }

  return (
    <>
      <style>
        {'html { scroll-padding-bottom: 6rem; } .site-footer { padding-bottom: 6rem; }'}
      </style>
      <form
        action="/api/exit-preview"
        aria-label={label}
        className="glass-surface fixed bottom-4 left-1/2 z-(--z-preview) flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-full border border-border py-2 pr-2 pl-5 text-sm shadow-raised"
        method="post"
      >
        <span aria-hidden className="size-2 shrink-0 rounded-full bg-accent" />
        <span className="truncate text-fg">{label}</span>
        <input name="path" type="hidden" value={pathname} />
        <button className={buttonClassName('secondary', 'shrink-0')} type="submit">
          {exitLabel}
        </button>
      </form>
    </>
  )
}
