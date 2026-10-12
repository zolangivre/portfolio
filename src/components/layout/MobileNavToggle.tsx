'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

type MobileNavToggleProps = {
  children: ReactNode
  closeLabel: string
  openLabel: string
}

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled])'

export function MobileNavToggle({ children, closeLabel, openLabel }: MobileNavToggleProps) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const button = buttonRef.current
    const panel = panelRef.current

    // The open drawer covers the page behind a scrim, so focus has to stay
    // inside it: Tab cycles between the toggle (which closes it) and the
    // drawer's own links and controls, instead of moving on to links the
    // scrim hides.
    const focusables = () => [
      ...(button ? [button] : []),
      ...Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []),
    ]

    focusables()[1]?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        button?.focus()

        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const items = focusables()
      const first = items[0]
      const last = items[items.length - 1]

      if (!first || !last) {
        return
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    const onResize = () => {
      if (window.innerWidth >= 880) {
        setOpen(false)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onResize)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  return (
    <>
      <button
        aria-controls="site-nav-panel"
        aria-expanded={open}
        aria-label={open ? closeLabel : openLabel}
        className="nav-toggle"
        data-open={open}
        onClick={() => setOpen((value) => !value)}
        ref={buttonRef}
        type="button"
      >
        <span className="nav-toggle-line" />
        <span className="nav-toggle-line" />
        <span className="nav-toggle-line" />
      </button>
      <div
        className="site-header-nav"
        data-open={open}
        id="site-nav-panel"
        onClick={(event) => {
          if ((event.target as HTMLElement).closest('a')) {
            setOpen(false)
          }
        }}
        ref={panelRef}
      >
        {children}
      </div>
      {/* Pointer-only shortcut: keyboard users close with Escape or the toggle. */}
      <div
        aria-hidden="true"
        className="nav-scrim"
        data-open={open}
        onClick={() => setOpen(false)}
      />
    </>
  )
}
