import { describe, expect, it } from 'vitest'

import { asMediaDoc, getMediaUrl, getRelationUrl, isVideo, type MediaDoc } from '@/lib/media'

const updatedAt = '2026-09-23T12:00:00.000Z'
const version = Date.parse(updatedAt)

const image = {
  id: 1,
  mimeType: 'image/webp',
  updatedAt,
  url: 'https://media.test/a.webp',
} as MediaDoc
const video = {
  id: 2,
  mimeType: 'video/mp4',
  updatedAt,
  url: 'https://media.test/b.mp4',
} as MediaDoc

describe('isVideo', () => {
  it.each([
    ['video/mp4', true],
    ['video/webm', true],
    ['image/png', false],
    [null, false],
    [undefined, false],
  ])('%s → %s', (mimeType, expected) => {
    expect(isVideo(mimeType)).toBe(expected)
  })
})

describe('getMediaUrl', () => {
  it('returns an image url as is', () => {
    expect(getMediaUrl(image)).toBe('https://media.test/a.webp')
  })

  // Videos skip the unique-filename hook, so a re-upload under the same name
  // lands on the same R2 key; the version keeps caches from serving the old one.
  it('versions a video url with its updatedAt', () => {
    expect(getMediaUrl(video)).toBe(`https://media.test/b.mp4?v=${version}`)
  })

  it.each([
    ['no updatedAt', { ...video, updatedAt: undefined }],
    ['an unparseable updatedAt', { ...video, updatedAt: 'yesterday' }],
  ])('leaves a video url alone with %s', (_label, media) => {
    expect(getMediaUrl(media as MediaDoc)).toBe('https://media.test/b.mp4')
  })

  it.each([
    ['an unpopulated id', 42],
    ['null', null],
    ['undefined', undefined],
    ['a doc without url', { ...image, url: null }],
  ])('returns null for %s', (_label, media) => {
    expect(getMediaUrl(media as MediaDoc)).toBeNull()
  })
})

describe('polymorphic relations', () => {
  it('resolves a populated relation', () => {
    expect(asMediaDoc({ relationTo: 'videos', value: video as never })).toBe(video)
    expect(getRelationUrl({ relationTo: 'videos', value: video as never })).toBe(
      `https://media.test/b.mp4?v=${version}`,
    )
  })

  it.each([
    ['an unpopulated id', { relationTo: 'media' as const, value: 7 }],
    ['null', null],
    ['undefined', undefined],
  ])('returns null for %s', (_label, relation) => {
    expect(asMediaDoc(relation)).toBeNull()
    expect(getRelationUrl(relation)).toBeNull()
  })
})
