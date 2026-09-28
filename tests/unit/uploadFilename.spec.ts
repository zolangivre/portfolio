import { describe, it, expect } from 'vitest'

import { withUniqueSuffix } from '@/lib/uploadFilename'

describe('withUniqueSuffix', () => {
  it('keeps the base name and extension', () => {
    expect(withUniqueSuffix('photo.png')).toMatch(/^photo-[a-z0-9]+\.png$/)
  })

  it('only touches the last extension', () => {
    expect(withUniqueSuffix('archive.tar.gz')).toMatch(/^archive\.tar-[a-z0-9]+\.gz$/)
  })

  it('handles names without an extension', () => {
    expect(withUniqueSuffix('README')).toMatch(/^README-[a-z0-9]+$/)
  })

  it('leaves dotfiles intact apart from the suffix', () => {
    expect(withUniqueSuffix('.gitignore')).toMatch(/^\.gitignore-[a-z0-9]+$/)
  })

  it('produces a different name for the same input', () => {
    const names = new Set(Array.from({ length: 50 }, () => withUniqueSuffix('photo.png')))
    expect(names.size).toBe(50)
  })
})
