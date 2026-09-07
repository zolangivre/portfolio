import { ImageResponse } from 'next/og'

import { getPaletteColor } from './theme/palette'

/**
 * Shared renderer for every `opengraph-image` route.
 *
 * The cards are always dark: a social feed shows them on both light and dark
 * chrome, and the dark ground is the one that keeps the accent readable in
 * either case. The accent itself comes from Payload (Global Settings → Theme),
 * so the previews follow the site's color instead of freezing whatever was
 * chosen the day this file was written.
 */

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

const BG = '#0a0d11'
const SURFACE = '#12161c'
const BORDER = 'rgba(238, 241, 244, 0.12)'
const FG = '#eef1f4'
const FG_MUTED = '#9aa4b2'

// satori parses ttf/otf/woff and nothing else. The v2 CSS endpoint negotiates
// on User-Agent and hands back woff2 (or EOT, if asked as an ancient browser);
// the v1 endpoint below always answers with truetype, whoever asks.
const GOOGLE_FONTS_CSS = 'https://fonts.googleapis.com/css'

type FontSpec = { family: string; weight: 400 | 500 | 600 | 700 }

const FONTS: FontSpec[] = [
  // The display face used for headings across the site.
  { family: 'Baloo 2', weight: 700 },
  // The body face, for the eyebrow and meta lines.
  { family: 'Inter', weight: 500 },
]

type LoadedFont = {
  data: ArrayBuffer
  name: string
  style: 'normal'
  weight: 400 | 500 | 600 | 700
}

async function fetchGoogleFont({ family, weight }: FontSpec): Promise<LoadedFont | null> {
  const cssUrl = `${GOOGLE_FONTS_CSS}?family=${family.replace(/ /g, '+')}:${weight}`

  const css = await fetch(cssUrl).then((response) => (response.ok ? response.text() : null))

  // Matching on the declared format rather than the first url() keeps a future
  // change to the endpoint from silently feeding satori a woff2 it can't read.
  const source = css?.match(/url\((https:\/\/[^)]+)\)\s*format\('(?:truetype|woff)'\)/)?.[1]

  if (!source) {
    return null
  }

  const data = await fetch(source).then((response) => (response.ok ? response.arrayBuffer() : null))

  return data ? { data, name: family, style: 'normal', weight } : null
}

// Module-level so a warm lambda (or a build generating many project cards in a
// row) downloads each face once instead of once per image.
let fontsPromise: Promise<LoadedFont[]> | null = null

function loadFonts(): Promise<LoadedFont[]> {
  fontsPromise ??= Promise.all(
    FONTS.map((font) =>
      fetchGoogleFont(font).catch((error) => {
        console.error(`Failed to load the "${font.family}" font for OG images.`, error)

        return null
      }),
    ),
  ).then((fonts) => fonts.filter((font): font is LoadedFont => font !== null))

  return fontsPromise
}

export type OgImageOptions = {
  /** Palette key from Global Settings → Theme. Falls back to the default. */
  accentKey?: string | null
  /** Small accent line above the title (section name, category…). */
  eyebrow?: string | null
  /** Dot-separated facts under the title (year, technologies, date…). */
  meta?: (string | null | undefined)[]
  /** Site owner's name, shown as the card's signature. */
  name?: string | null
  /** Owner's job title, next to the name. */
  profession?: string | null
  /** The headline. Long titles shrink rather than overflow. */
  title: string
}

export async function renderOgImage({
  accentKey,
  eyebrow,
  meta,
  name,
  profession,
  title,
}: OgImageOptions) {
  const accent = getPaletteColor(accentKey).dark
  const fonts = await loadFonts()
  const metaLine = (meta ?? []).filter((entry) => Boolean(entry && entry.trim())).join('  ·  ')

  // On the homepage the headline *is* the name, and printing it twice reads as
  // a mistake — the signature row then carries the profession alone.
  const signature =
    name && name.trim().toLowerCase() !== title.trim().toLowerCase() ? name : null

  // Rough fit: the display face is wide, so the longest titles step down two
  // sizes rather than wrapping into four cramped lines.
  const titleSize = title.length > 70 ? 60 : title.length > 40 ? 76 : 92

  return new ImageResponse(
    (
      <div
        style={{
          background: BG,
          display: 'flex',
          height: '100%',
          padding: 48,
          position: 'relative',
          width: '100%',
        }}
      >
        <div
          style={{
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            borderRadius: 44,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'space-between',
            overflow: 'hidden',
            padding: '56px 64px',
            position: 'relative',
            width: '100%',
          }}
        >
          {/* Soft accent bloom, echoing the site's ambient background. Inside
              the card rather than behind it — the card is opaque, so a bloom
              underneath would only ever show in the 48px outer margin. */}
          <div
            style={{
              backgroundImage: `radial-gradient(circle at 88% 0%, ${accent}73 0%, ${accent}1a 38%, ${accent}00 62%)`,
              display: 'flex',
              inset: 0,
              position: 'absolute',
            }}
          />

          <div style={{ alignItems: 'center', display: 'flex', gap: 16, position: 'relative' }}>
            <div
              style={{
                background: accent,
                borderRadius: 999,
                display: 'flex',
                height: 18,
                width: 18,
              }}
            />
            {signature ? (
              <div
                style={{
                  color: FG,
                  fontFamily: 'Baloo 2',
                  fontSize: 30,
                  letterSpacing: '-0.02em',
                }}
              >
                {signature}
              </div>
            ) : null}
            {profession ? (
              <div style={{ color: FG_MUTED, fontFamily: 'Inter', fontSize: 24 }}>
                {profession}
              </div>
            ) : null}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {eyebrow ? (
              <div
                style={{
                  color: accent,
                  fontFamily: 'Inter',
                  fontSize: 20,
                  letterSpacing: '0.14em',
                  marginBottom: 18,
                  textTransform: 'uppercase',
                }}
              >
                {eyebrow}
              </div>
            ) : null}
            <div
              style={{
                color: FG,
                display: 'flex',
                fontFamily: 'Baloo 2',
                fontSize: titleSize,
                letterSpacing: '-0.04em',
                lineHeight: 1.08,
                maxWidth: 960,
              }}
            >
              {title}
            </div>
          </div>

          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'space-between',
              position: 'relative',
            }}
          >
            <div style={{ color: FG_MUTED, fontFamily: 'Inter', fontSize: 26 }}>{metaLine}</div>
            <div
              style={{
                background: `${accent}1f`,
                border: `1px solid ${accent}3d`,
                borderRadius: 999,
                color: accent,
                display: 'flex',
                fontFamily: 'Inter',
                fontSize: 22,
                padding: '10px 24px',
              }}
            >
              {new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').host}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      // An empty list makes @vercel/og fall back to its bundled font, which is
      // the right outcome if Google Fonts is unreachable during a build.
      fonts: fonts.length > 0 ? fonts : undefined,
    },
  )
}
