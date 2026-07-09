'use client'

import { useEffect } from 'react'

const SCROLL_THRESHOLD = 8

export function HeaderScrollWatcher() {
  useEffect(() => {
    const header = document.querySelector('.site-header')

    if (!header) {
      return
    }

    const updateScrolled = () => {
      header.setAttribute('data-scrolled', window.scrollY > SCROLL_THRESHOLD ? 'true' : 'false')
    }

    updateScrolled()
    window.addEventListener('scroll', updateScrolled, { passive: true })

    return () => window.removeEventListener('scroll', updateScrolled)
  }, [])

  return null
}
