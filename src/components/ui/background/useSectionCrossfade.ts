'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, type RefObject } from 'react'

/**
 * Paints `layer` for the part of the page now in view and says whether it
 * should show: `section` is the id of the `<section>` in the middle band of
 * the screen (null above the first one — the hero), `index` its position
 * (0 for the hero, then 1, 2… in page order). May be async, to wait for an
 * image to decode before it fades in.
 */
export type PaintLayer = (
  layer: HTMLElement,
  section: string | null,
  index: number,
) => boolean | Promise<boolean>

/**
 * Two stacked layers inside `containerRef` (matched by `selector`) that take
 * turns as the visitor scrolls from section to section: the hidden one is
 * painted for the new section, then the two cross-fade through their
 * `data-on` attribute — only opacity animates (styles.css), and only the
 * layer that's out of sight is ever repainted. A section counts as current
 * once it reaches the middle tenth of the screen. Re-run per route, since
 * each page has its own sections.
 */
export function useSectionCrossfade(
  containerRef: RefObject<HTMLElement | null>,
  selector: string,
  paint: PaintLayer,
) {
  const pathname = usePathname()
  // Latest paint without re-subscribing the observer whenever it changes.
  const paintRef = useRef(paint)

  useEffect(() => {
    paintRef.current = paint
  })

  useEffect(() => {
    const layers = containerRef.current?.querySelectorAll<HTMLElement>(selector)
    const sections = Array.from(document.querySelectorAll<HTMLElement>('main section[id]'))

    if (!layers || layers.length < 2) {
      return
    }

    let front = layers[0]!
    let back = layers[1]!
    let current: string | null | undefined
    // A newer change while an async paint is still pending wins.
    let generation = 0
    const inBand = new Set<string>()

    const show = async (section: string | null) => {
      if (section === current) {
        return
      }

      current = section
      const ticket = ++generation
      const index = section ? sections.findIndex((item) => item.id === section) + 1 : 0
      const visible = await paintRef.current(back, section, index)

      if (ticket !== generation) {
        return
      }

      if (!visible) {
        front.dataset.on = 'false'
        back.dataset.on = 'false'

        return
      }

      back.dataset.on = 'true'
      front.dataset.on = 'false'
      ;[front, back] = [back, front]
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            inBand.add(entry.target.id)
          } else {
            inBand.delete(entry.target.id)
          }
        }

        void show(sections.find((item) => inBand.has(item.id))?.id ?? null)
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )

    sections.forEach((section) => observer.observe(section))
    // The top of the page has no section in the band: paint the hero now.
    void show(null)

    return () => {
      generation++
      observer.disconnect()
    }
  }, [containerRef, pathname, selector])
}
