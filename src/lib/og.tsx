import { ImageResponse } from 'next/og'

import { getGlobalSettings } from '@/lib/queries'
import { getPaletteColor } from '@/lib/theme/palette'
import type { Locale } from '@/lib/locale'

/** Facebook/LinkedIn/X all crop around this ratio. */
export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

type OgImageArgs = {
  eyebrow?: string | null
  title: string
  locale: Locale
}

/**
 * Shared Open Graph card.
 *
 * Uses the accent colour chosen in the CMS so shared links look like the site
 * rather than a generic screenshot. No custom font is loaded on purpose:
 * ImageResponse falls back to its bundled sans, which keeps this from becoming
 * a build-time network fetch that can fail the whole deploy.
 */
export async function renderOgImage({ eyebrow, title, locale }: OgImageArgs) {
  const settings = await getGlobalSettings(locale)
  const accent = getPaletteColor(settings?.theme?.accentColor).dark
  const name = settings?.name ?? 'Portfolio'

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#10141a',
          padding: 72,
          position: 'relative',
        }}
      >
        {/* Soft accent wash, echoing the site's ambient background. */}
        <div
          style={{
            position: 'absolute',
            top: -260,
            right: -160,
            width: 720,
            height: 720,
            borderRadius: '50%',
            background: accent,
            opacity: 0.22,
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: accent }} />
          <div
            style={{
              color: '#f4f6f8',
              fontSize: 26,
              letterSpacing: 2,
              textTransform: 'uppercase',
              opacity: 0.85,
            }}
          >
            {name}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {eyebrow ? (
            <div style={{ color: accent, fontSize: 28, letterSpacing: 3, textTransform: 'uppercase' }}>
              {eyebrow}
            </div>
          ) : null}
          <div
            style={{
              color: '#ffffff',
              fontSize: title.length > 60 ? 62 : 78,
              lineHeight: 1.1,
              fontWeight: 700,
              // ImageResponse has no multi-line clamp, so long titles are cut
              // to keep the card from overflowing its own frame.
              display: 'flex',
            }}
          >
            {title.length > 110 ? `${title.slice(0, 107)}…` : title}
          </div>
        </div>

        <div style={{ display: 'flex', height: 8, borderRadius: 4, background: accent, width: 200 }} />
      </div>
    ),
    OG_SIZE,
  )
}
