import { describe, expect, it } from 'vitest'

import { socialLinkLabel } from '@/components/ui/SocialIcons'

describe('socialLinkLabel', () => {
  it.each([
    ['github', 'GitHub'],
    ['linkedin', 'LinkedIn'],
    ['x', 'X'],
    ['instagram', 'Instagram'],
    ['dribbble', 'Dribbble'],
  ])('%s → its brand spelling', (platform, label) => {
    expect(socialLinkLabel(platform, 'https://example.com/someone')).toBe(label)
  })

  it('names an unknown platform after its site', () => {
    expect(socialLinkLabel('other', 'https://www.malt.fr/profile/someone')).toBe('malt.fr')
    expect(socialLinkLabel('other', 'https://behance.net/someone')).toBe('behance.net')
  })

  it('falls back to the raw value when the URL does not parse', () => {
    expect(socialLinkLabel('other', 'not a url')).toBe('not a url')
  })
})
