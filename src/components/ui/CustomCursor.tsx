'use client'

import { useEffect, useRef } from 'react'

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], input, textarea, select, summary, label, [data-cursor="pointer"]'

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches

    if (prefersReducedMotion || !hasFinePointer) {
      return
    }

    const dot = dotRef.current
    const ring = ringRef.current

    if (!dot || !ring) {
      return
    }

    document.documentElement.classList.add('has-custom-cursor')

    let pointerX = window.innerWidth / 2
    let pointerY = window.innerHeight / 2
    let ringX = pointerX
    let ringY = pointerY
    let visible = false
    let frame = 0

    function render() {
      ringX += (pointerX - ringX) * 0.16
      ringY += (pointerY - ringY) * 0.16

      dot!.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`
      ring!.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`

      frame = requestAnimationFrame(render)
    }

    function show() {
      if (!visible) {
        visible = true
        dot!.classList.add('is-visible')
        ring!.classList.add('is-visible')
      }
    }

    function hide() {
      visible = false
      dot!.classList.remove('is-visible')
      ring!.classList.remove('is-visible')
    }

    function handlePointerMove(event: PointerEvent) {
      pointerX = event.clientX
      pointerY = event.clientY
      show()
    }

    function handlePointerOver(event: PointerEvent) {
      const target = event.target
      if (target instanceof Element && target.closest(INTERACTIVE_SELECTOR)) {
        ring!.classList.add('is-hovering')
        dot!.classList.add('is-hovering')
      }
    }

    function handlePointerOut(event: PointerEvent) {
      const target = event.target
      if (target instanceof Element && target.closest(INTERACTIVE_SELECTOR)) {
        ring!.classList.remove('is-hovering')
        dot!.classList.remove('is-hovering')
      }
    }

    function handlePointerDown() {
      ring!.classList.add('is-pressed')
    }

    function handlePointerUp() {
      ring!.classList.remove('is-pressed')
    }

    function handleLeaveWindow(event: MouseEvent) {
      if (!event.relatedTarget) {
        hide()
      }
    }

    frame = requestAnimationFrame(render)

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerover', handlePointerOver, { passive: true })
    window.addEventListener('pointerout', handlePointerOut, { passive: true })
    window.addEventListener('pointerdown', handlePointerDown, { passive: true })
    window.addEventListener('pointerup', handlePointerUp, { passive: true })
    document.addEventListener('mouseout', handleLeaveWindow)

    return () => {
      document.documentElement.classList.remove('has-custom-cursor')
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerover', handlePointerOver)
      window.removeEventListener('pointerout', handlePointerOut)
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointerup', handlePointerUp)
      document.removeEventListener('mouseout', handleLeaveWindow)
    }
  }, [])

  return (
    <div aria-hidden="true">
      <div className="cursor-ring" ref={ringRef} />
      <div className="cursor-dot" ref={dotRef} />
    </div>
  )
}
