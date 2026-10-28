import type { WidgetServerProps } from 'payload'

import { getPendingDrafts } from '@/lib/queries/dashboard'

import { formatDate, WidgetShell } from './WidgetShell'

export async function PendingDraftsWidget({ req }: WidgetServerProps) {
  const drafts = await getPendingDrafts(req.payload)

  return (
    <WidgetShell
      empty="Aucun brouillon en attente : tout est publié."
      rows={drafts.map((draft) => ({
        href: draft.href,
        key: draft.href,
        meta: `${draft.collectionLabel} · ${formatDate(draft.updatedAt)}`,
        title: draft.label,
      }))}
      title="Brouillons en cours"
    />
  )
}
