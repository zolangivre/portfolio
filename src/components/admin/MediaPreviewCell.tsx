import type { DefaultServerCellComponentProps } from 'payload'

export function MediaPreviewCell({ rowData }: DefaultServerCellComponentProps) {
  const url = typeof rowData?.url === 'string' ? rowData.url : null
  const mimeType = typeof rowData?.mimeType === 'string' ? rowData.mimeType : null
  const alt = typeof rowData?.alt === 'string' ? rowData.alt : ''

  if (!url || !mimeType?.startsWith('image/')) {
    return null
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      src={url}
      style={{
        borderRadius: '4px',
        display: 'block',
        height: '40px',
        objectFit: 'cover',
        width: '40px',
      }}
    />
  )
}
