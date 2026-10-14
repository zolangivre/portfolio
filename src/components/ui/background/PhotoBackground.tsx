'use client'

import { useRef } from 'react'

import { useSectionCrossfade } from './useSectionCrossfade'

/** Resolves once `src` is decoded, so a layer never fades in half-drawn. */
async function decoded(src: string) {
  const image = new Image()
  image.src = src

  try {
    await image.decode()
  } catch {
    // A broken or blocked image just fades in empty.
  }
}

/**
 * "Photos floutées": the owner's own photos as the page's backdrop, blurred
 * into colour and light like an iOS wallpaper behind its glass — the first
 * behind the top of the page, then one per section, in order, cross-fading
 * as each section reaches the middle of the screen (the list wraps around
 * when it's shorter than the page). A veil of the page colour on top keeps
 * text as legible as on a plain background.
 *
 * The blur is a static filter on a fixed layer: rasterized once per photo,
 * never while scrolling.
 */
export function PhotoBackground({ photos }: { photos: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useSectionCrossfade(containerRef, '.ambient-photo', async (layer, _section, index) => {
    const src = photos[index % photos.length]

    if (!src) {
      return false
    }

    if (layer.dataset.src !== src) {
      await decoded(src)
      layer.style.backgroundImage = `url("${src.replace(/"/g, '%22')}")`
      layer.dataset.src = src
    }

    return true
  })

  return (
    <div aria-hidden="true" className="ambient-background" data-variant="photo" ref={containerRef}>
      <div className="ambient-photo" data-on="false" />
      <div className="ambient-photo" data-on="false" />
      <div className="ambient-photo-veil" />
      <div className="ambient-grain" />
    </div>
  )
}
