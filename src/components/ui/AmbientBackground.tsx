import dynamic from 'next/dynamic'

import type { Setting } from '@/payload-types'

import { GradientBackground } from './background/GradientBackground'

/*
 * One chunk per background, loaded only for the one chosen: a static import
 * of all six would ship every variant's code — the playground's physics
 * included — to every visitor. Still server-rendered, so nothing pops in.
 * The default (and fallback) stays a plain import.
 */
const ColorBlocksBackground = dynamic(() =>
  import('./background/ColorBlocksBackground').then((module) => module.ColorBlocksBackground),
)
const DaylightBackground = dynamic(() =>
  import('./background/DaylightBackground').then((module) => module.DaylightBackground),
)
const PhotoBackground = dynamic(() =>
  import('./background/PhotoBackground').then((module) => module.PhotoBackground),
)
const PlaygroundBackground = dynamic(() =>
  import('./background/PlaygroundBackground').then((module) => module.PlaygroundBackground),
)
const SpatialBackground = dynamic(() =>
  import('./background/SpatialBackground').then((module) => module.SpatialBackground),
)

export type BackgroundStyle = NonNullable<NonNullable<Setting['theme']>['backgroundStyle']>

type AmbientBackgroundProps = {
  /** URLs of the photos picked in the CMS, for the photo background. */
  photos: string[]
  /** Settings → Thème → Fond du site. */
  variant?: BackgroundStyle | null
}

/**
 * The fixed layer behind every page. Which one is chosen in the CMS; each
 * variant is its own component and its own chunk, so only the chosen one's
 * code is sent and runs. The photo background falls back to the coloured
 * glows until photos are added.
 */
export function AmbientBackground({ photos, variant }: AmbientBackgroundProps) {
  switch (variant) {
    case 'photo':
      return photos.length > 0 ? <PhotoBackground photos={photos} /> : <GradientBackground />
    case 'spatial':
      return <SpatialBackground />
    case 'playground':
      return <PlaygroundBackground />
    case 'daylight':
      return <DaylightBackground />
    case 'colorBlocks':
      return <ColorBlocksBackground />
    default:
      return <GradientBackground />
  }
}
