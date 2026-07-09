/**
 * Central color registry for the admin-driven theme system.
 *
 * Each entry only needs a light-mode and dark-mode accent hex plus which
 * foreground text tone (light or dark) reads best on top of it — every other
 * derived value (hover/strong shade, soft background tint, soft border) is
 * computed generically from `--accent` via `color-mix()` in globals.css, so
 * adding a new color here is enough to make it fully themed everywhere.
 *
 * To add a color: append an entry with a unique `key`. It will automatically
 * appear in the Payload admin picker (with a swatch) and become selectable.
 */

export type ForegroundTone = 'dark' | 'light'

export interface PaletteColor {
  key: string
  label: string
  light: string
  dark: string
  fgOnLight: ForegroundTone
  fgOnDark: ForegroundTone
}

// Near-white / near-black text tones used on top of accent-colored surfaces.
export const FOREGROUND_TONES: Record<ForegroundTone, string> = {
  light: '#fff8f0',
  dark: '#180f06',
}

export const palette: PaletteColor[] = [
  { key: 'orange', label: 'Orange', light: '#a1490c', dark: '#ff8a3d', fgOnLight: 'light', fgOnDark: 'dark' },
  { key: 'coral', label: 'Coral', light: '#c2410c', dark: '#ff8566', fgOnLight: 'light', fgOnDark: 'dark' },
  { key: 'red', label: 'Red', light: '#b91c1c', dark: '#f87171', fgOnLight: 'light', fgOnDark: 'dark' },
  { key: 'crimson', label: 'Crimson', light: '#9f1239', dark: '#fb7185', fgOnLight: 'light', fgOnDark: 'dark' },
  { key: 'rose', label: 'Rose', light: '#be123c', dark: '#fb7185', fgOnLight: 'light', fgOnDark: 'dark' },
  { key: 'pink', label: 'Pink', light: '#be185d', dark: '#f472b6', fgOnLight: 'light', fgOnDark: 'dark' },
  { key: 'purple', label: 'Purple', light: '#7e22ce', dark: '#c084fc', fgOnLight: 'light', fgOnDark: 'dark' },
  { key: 'violet', label: 'Violet', light: '#6d28d9', dark: '#a78bfa', fgOnLight: 'light', fgOnDark: 'dark' },
  { key: 'indigo', label: 'Indigo', light: '#4338ca', dark: '#818cf8', fgOnLight: 'light', fgOnDark: 'dark' },
  { key: 'blue', label: 'Blue', light: '#1d4ed8', dark: '#60a5fa', fgOnLight: 'light', fgOnDark: 'dark' },
  { key: 'sky', label: 'Sky', light: '#0369a1', dark: '#38bdf8', fgOnLight: 'light', fgOnDark: 'dark' },
  { key: 'cyan', label: 'Cyan', light: '#0e7490', dark: '#22d3ee', fgOnLight: 'light', fgOnDark: 'dark' },
  { key: 'teal', label: 'Teal', light: '#0f766e', dark: '#2dd4bf', fgOnLight: 'light', fgOnDark: 'dark' },
  { key: 'mint', label: 'Mint', light: '#0c815e', dark: '#6ee7b7', fgOnLight: 'light', fgOnDark: 'dark' },
  { key: 'emerald', label: 'Emerald', light: '#047857', dark: '#34d399', fgOnLight: 'light', fgOnDark: 'dark' },
  { key: 'green', label: 'Green', light: '#15803d', dark: '#4ade80', fgOnLight: 'light', fgOnDark: 'dark' },
  { key: 'lime', label: 'Lime', light: '#4d7c0f', dark: '#a3e635', fgOnLight: 'light', fgOnDark: 'dark' },
  { key: 'olive', label: 'Olive', light: '#5f6b1f', dark: '#c3d16a', fgOnLight: 'light', fgOnDark: 'dark' },
  { key: 'gold', label: 'Gold', light: '#92660a', dark: '#e8b93f', fgOnLight: 'light', fgOnDark: 'dark' },
  { key: 'amber', label: 'Amber', light: '#b45309', dark: '#fbbf24', fgOnLight: 'light', fgOnDark: 'dark' },
  { key: 'yellow', label: 'Yellow', light: '#a16207', dark: '#facc15', fgOnLight: 'light', fgOnDark: 'dark' },
  { key: 'slate', label: 'Slate', light: '#475569', dark: '#a3b1c6', fgOnLight: 'light', fgOnDark: 'dark' },
  { key: 'gray', label: 'Gray', light: '#4b5563', dark: '#a8afb8', fgOnLight: 'light', fgOnDark: 'dark' },
  { key: 'neutral', label: 'Neutral', light: '#525252', dark: '#a8a8a8', fgOnLight: 'light', fgOnDark: 'dark' },
]

export const paletteByKey: Record<string, PaletteColor> = Object.fromEntries(
  palette.map((color) => [color.key, color]),
)

export const DEFAULT_PALETTE_KEY = 'orange'

export function getPaletteColor(key: string | null | undefined): PaletteColor {
  if (key && paletteByKey[key]) {
    return paletteByKey[key]
  }

  return paletteByKey[DEFAULT_PALETTE_KEY]
}

/**
 * Builds the inline <style> content that overrides --accent/--accent-fg/
 * --accent-2 for the current request, based on the primary/accent colors
 * chosen in Payload. Every other accent-* token is derived from these via
 * color-mix() in globals.css, so this is the only per-color CSS needed.
 */
export function buildThemeStyle(primaryKey: string | null | undefined, accentKey: string | null | undefined) {
  const primary = getPaletteColor(primaryKey)
  const accent = accentKey ? getPaletteColor(accentKey) : null

  return `:root {
  --accent: ${primary.light};
  --accent-fg: ${FOREGROUND_TONES[primary.fgOnLight]};
  --accent-2: ${accent ? accent.light : 'var(--accent)'};
}
:root.dark {
  --accent: ${primary.dark};
  --accent-fg: ${FOREGROUND_TONES[primary.fgOnDark]};
  --accent-2: ${accent ? accent.dark : 'var(--accent)'};
}`
}
