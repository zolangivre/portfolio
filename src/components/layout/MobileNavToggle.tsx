'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

type MobileNavToggleProps = {
  children: ReactNode
  closeLabel: string
  openLabel: string
}

export function MobileNavToggle({ children, closeLabel, openLabel }: MobileNavToggleProps) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
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
      <div className="nav-scrim" data-open={open} onClick={() => setOpen(false)} />
    </>
  )
}
