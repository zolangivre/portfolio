import type { DefaultServerCellComponentProps } from 'payload'

import { isValidHexColor } from '@/lib/color'

export function TechColorSwatchCell({ cellData }: DefaultServerCellComponentProps) {
  const value = typeof cellData === 'string' ? cellData : undefined

  if (!value) {
    return null
  }

  return (
    <div style={{ alignItems: 'center', display: 'flex', gap: '0.5rem' }}>
      {isValidHexColor(value) ? (
        <span
          style={{
            background: value,
            border: '1px solid rgba(0, 0, 0, 0.15)',
            borderRadius: '4px',
            display: 'inline-block',
            height: '14px',
            width: '14px',
          }}
        />
      ) : null}
      <span>{value}</span>
    </div>
  )
}
