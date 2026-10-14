import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

import { placeholderProps, type MediaDoc } from '@/lib/media'
import { canHavePlaceholder, makePlaceholder } from '@/lib/placeholder'

describe('canHavePlaceholder', () => {
  it.each([
    ['image/jpeg', true],
    ['image/webp', true],
    ['image/svg+xml', false],
    ['application/pdf', false],
    ['video/mp4', false],
    [null, false],
    [undefined, false],
  ])('%s → %s', (mimeType, expected) => {
    expect(canHavePlaceholder(mimeType)).toBe(expected)
  })
})

describe('makePlaceholder', () => {
  it('shrinks an image to a tiny webp data URL, keeping its proportions', async () => {
    const photo = await sharp({
      create: { background: '#3a7bd5', channels: 3, height: 300, width: 600 },
    })
      .png()
      .toBuffer()

    const preview = await makePlaceholder(photo)

    expect(preview).toMatch(/^data:image\/webp;base64,/)

    const decoded = Buffer.from(preview!.split(',')[1], 'base64')
    const { height, width } = await sharp(decoded).metadata()

    expect({ height, width }).toEqual({ height: 8, width: 16 })
  })

  it('returns null for a file that is not an image', async () => {
    expect(await makePlaceholder(Buffer.from('not an image'))).toBeNull()
  })
})

describe('placeholderProps', () => {
  it('turns a stored preview into next/image blur props', () => {
    const media = { id: 1, placeholder: 'data:image/webp;base64,AAAA' } as MediaDoc

    expect(placeholderProps(media)).toEqual({
      blurDataURL: 'data:image/webp;base64,AAAA',
      placeholder: 'blur',
    })
  })

  it.each([
    ['an image without a preview', { id: 1, placeholder: null } as MediaDoc],
    ['an unpopulated relation', 3],
    ['no media', null],
    ['undefined', undefined],
  ])('gives no props for %s', (_, media) => {
    expect(placeholderProps(media)).toEqual({})
  })
})
