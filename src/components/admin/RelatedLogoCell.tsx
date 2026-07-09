import type { DefaultServerCellComponentProps } from 'payload'

import { getMediaUrl } from '@/lib/media'
import type { Company, School } from '@/payload-types'

async function renderRelatedLogoCell({
  cellData,
  collection,
  collectionSlug,
  link,
  linkURL,
  payload,
  rowData,
}: {
  cellData: unknown
  collection: 'companies' | 'schools'
  collectionSlug: DefaultServerCellComponentProps['collectionSlug']
  link: DefaultServerCellComponentProps['link']
  linkURL: DefaultServerCellComponentProps['linkURL']
  payload: DefaultServerCellComponentProps['payload']
  rowData: DefaultServerCellComponentProps['rowData']
}) {
  const id =
    typeof cellData === 'object' && cellData !== null && 'id' in cellData
      ? (cellData as { id: number }).id
      : (cellData as number | string | undefined)

  if (id === undefined || id === null) {
    return null
  }

  const doc = (await payload.findByID({
    collection,
    id,
    depth: 1,
  })) as Company | School

  const logoUrl = getMediaUrl(doc.logo)

  const content = (
    <>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          height={20}
          src={logoUrl}
          style={{ borderRadius: '4px', objectFit: 'contain' }}
          width={20}
        />
      ) : null}
      <span>{doc.name}</span>
    </>
  )

  const style = { alignItems: 'center', display: 'flex', gap: '0.5rem' } as const

  if (link) {
    const adminRoute = payload.config.routes?.admin ?? '/admin'
    const href = linkURL ?? `${adminRoute}/collections/${collectionSlug}/${rowData.id}`

    return (
      <a href={href} style={style}>
        {content}
      </a>
    )
  }

  return <div style={style}>{content}</div>
}

export async function CompanyLogoCell(props: DefaultServerCellComponentProps) {
  return renderRelatedLogoCell({
    cellData: props.cellData,
    collection: 'companies',
    collectionSlug: props.collectionSlug,
    link: props.link,
    linkURL: props.linkURL,
    payload: props.payload,
    rowData: props.rowData,
  })
}

export async function SchoolLogoCell(props: DefaultServerCellComponentProps) {
  return renderRelatedLogoCell({
    cellData: props.cellData,
    collection: 'schools',
    collectionSlug: props.collectionSlug,
    link: props.link,
    linkURL: props.linkURL,
    payload: props.payload,
    rowData: props.rowData,
  })
}
