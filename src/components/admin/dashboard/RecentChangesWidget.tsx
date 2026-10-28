import type { WidgetServerProps } from 'payload'

import { getRecentChanges } from '@/lib/queries/dashboard'

import { formatDate, WidgetShell } from './WidgetShell'

export async function RecentChangesWidget({ req }: WidgetServerProps) {
  const changes = await getRecentChanges(req.payload)

  return (
    <WidgetShell
      empty="Rien n’a encore été modifié."
      rows={changes.map((change) => ({
        href: change.href,
        key: change.href,
        meta: `${change.collectionLabel} · ${formatDate(change.updatedAt)}`,
        title: change.label,
      }))}
      title="Dernières modifications"
    />
  )
}
