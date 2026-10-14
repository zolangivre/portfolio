'use client'

import { useRef } from 'react'

import { useSectionCrossfade } from './useSectionCrossfade'

/**
 * "Aplats de couleur": no light effects at all — the page is one flat
 * colour per section, like Apple's product pages, eased from one to the
 * next as you scroll (never an abrupt jump in brightness). The colours are
 * the CMS accents mixed into the page background (--block-<id> in
 * styles.css): a richer one behind the top of the page, softer ones under
 * the sections you read.
 */
export function ColorBlocksBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useSectionCrossfade(containerRef, '.ambient-block', (layer, section) => {
    layer.style.setProperty(
      '--block',
      section ? `var(--block-${section}, var(--block-default))` : 'var(--block-hero)',
    )

    return true
  })

  return (
    <div
      aria-hidden="true"
      className="ambient-background"
      data-variant="colorBlocks"
      ref={containerRef}
    >
      <div className="ambient-block" data-on="false" />
      <div className="ambient-block" data-on="false" />
    </div>
  )
}
