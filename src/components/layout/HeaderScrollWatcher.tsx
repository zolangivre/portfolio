'use client'

import { useEffect } from 'react'

const SCROLL_THRESHOLD = 8

export function HeaderScrollWatcher() {
  useEffect(() => {
    const header = document.querySelector('.site-header')

    if (!header) {
      return
    }

    let frame = 0

    const updateScrolled = () => {
      frame = 0
      header.setAttribute('data-scrolled', window.scrollY > SCROLL_THRESHOLD ? 'true' : 'false')
    }

    const requestUpdate = () => {
      if (frame === 0) {
        frame = window.requestAnimationFrame(updateScrolled)
      }
    }

    updateScrolled()
    window.addEventListener('scroll', requestUpdate, { passive: true })

    return () => {
      window.removeEventListener('scroll', requestUpdate)

      if (frame !== 0) {
        window.cancelAnimationFrame(frame)
      }
    }
  }, [])

  return null
}
