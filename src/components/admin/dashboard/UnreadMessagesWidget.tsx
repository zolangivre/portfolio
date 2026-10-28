import type { WidgetServerProps } from 'payload'

import { getUnreadMessages } from '@/lib/queries/dashboard'

import { formatDate, WidgetShell } from './WidgetShell'

export async function UnreadMessagesWidget({ req }: WidgetServerProps) {
  const { latest, total } = await getUnreadMessages(req.payload)
  const admin = req.payload.config.routes.admin

  return (
    <WidgetShell
      aside={total > 0 ? <span className="dashboard-widget__count">{total}</span> : null}
      empty="Aucun message non lu."
      rows={latest.map((message) => ({
        href: `${admin}/collections/messages/${message.id}`,
        key: String(message.id),
        meta: formatDate(message.createdAt),
        title: message.name,
      }))}
      title="Messages non lus"
    />
  )
}
