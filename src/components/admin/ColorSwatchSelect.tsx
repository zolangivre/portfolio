'use client'

import { useField } from '@payloadcms/ui'
import type { SelectFieldClientComponent } from 'payload'

import { palette } from '@/lib/theme/palette'

export const ColorSwatchSelect: SelectFieldClientComponent = ({ field, path }) => {
  const { setValue, value } = useField<string>({ path })
  const allowsEmpty = !field.required

  return (
    <div className="color-swatch-select">
      {allowsEmpty ? (
        <button
          aria-label="None"
          aria-pressed={!value}
          className="color-swatch-select__item color-swatch-select__item--empty"
          data-active={!value}
          key="__none"
          onClick={() => setValue(null)}
          title="None"
          type="button"
        />
      ) : null}
      {palette.map((color) => {
        const active = value === color.key

        return (
          <button
            aria-label={color.label}
            aria-pressed={active}
            className="color-swatch-select__item"
            data-active={active}
            key={color.key}
            onClick={() => setValue(color.key)}
            style={{ background: `linear-gradient(135deg, ${color.light} 50%, ${color.dark} 50%)` }}
            title={color.label}
            type="button"
          />
        )
      })}
    </div>
  )
}
