import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { isValidHexColor } from '@/lib/color'
import {
  buildThemeStyle,
  DEFAULT_PALETTE_KEY,
  FOREGROUND_TONES,
  getPaletteColor,
  palette,
} from '@/lib/theme/palette'

/**
 * The accent is picked in the CMS, so any palette entry can end up on the
 * live site. These checks hold every entry to WCAG AA (4.5:1) for the two
 * pairs it always produces: button text on the accent, and accent text on the
 * page background.
 */

// Read from globals.css so the check follows the real page background.
const css = readFileSync('src/app/globals.css', 'utf8')
const [lightBlock, darkBlock] = css.split(':root.dark')
const pageBackground = {
  dark: darkBlock!.match(/--bg:\s*(#[0-9a-f]{6})/i)![1]!,
  light: lightBlock!.match(/--bg:\s*(#[0-9a-f]{6})/i)![1]!,
}

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))

  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

const contrast = (a: string, b: string) => {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x)

  return (lighter! + 0.05) / (darker! + 0.05)
}

const AA = 4.5

describe('palette', () => {
  it('has unique keys and valid hex values', () => {
    expect(new Set(palette.map((color) => color.key)).size).toBe(palette.length)

    for (const color of palette) {
      expect(isValidHexColor(color.light), color.key).toBe(true)
      expect(isValidHexColor(color.dark), color.key).toBe(true)
    }
  })

  it.each(palette.map((color) => [color.key, color] as const))(
    '%s: button text on the accent meets AA in both modes',
    (_key, color) => {
      expect(contrast(color.light, FOREGROUND_TONES[color.fgOnLight])).toBeGreaterThanOrEqual(AA)
      expect(contrast(color.dark, FOREGROUND_TONES[color.fgOnDark])).toBeGreaterThanOrEqual(AA)
    },
  )

  it.each(palette.map((color) => [color.key, color] as const))(
    '%s: accent text on the page background meets AA in both modes',
    (_key, color) => {
      expect(contrast(color.light, pageBackground.light)).toBeGreaterThanOrEqual(AA)
      expect(contrast(color.dark, pageBackground.dark)).toBeGreaterThanOrEqual(AA)
    },
  )

  it('falls back to the default color for an unknown or empty key', () => {
    expect(getPaletteColor('not-a-color').key).toBe(DEFAULT_PALETTE_KEY)
    expect(getPaletteColor(null).key).toBe(DEFAULT_PALETTE_KEY)
    expect(getPaletteColor('sky').key).toBe('sky')
  })

  it('builds the theme style for both modes', () => {
    const sky = getPaletteColor('sky')
    const lime = getPaletteColor('lime')
    const style = buildThemeStyle('sky', 'lime')

    expect(style).toContain(`--accent: ${sky.light};`)
    expect(style).toContain(`--accent: ${sky.dark};`)
    expect(style).toContain(`--accent-2: ${lime.light};`)
    expect(style).toContain(`--accent-2: ${lime.dark};`)
  })

  it('reuses the primary color when no secondary accent is chosen', () => {
    expect(buildThemeStyle('sky', null)).toContain('--accent-2: var(--accent);')
  })
})
