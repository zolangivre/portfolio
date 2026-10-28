import type { WidgetServerProps } from 'payload'

import { getScheduledPublishes } from '@/lib/queries/dashboard'

import { formatDate, WidgetShell } from './WidgetShell'

export async function ScheduledPublishesWidget({ req }: WidgetServerProps) {
  const scheduled = await getScheduledPublishes(req.payload)

  return (
    <WidgetShell
      empty="Aucune publication programmée."
      rows={scheduled.map((item, index) => ({
        href: item.href,
        key: `${item.href}-${index}`,
        // The date picked in the admin is a "not before": the cron runs once
        // a day, so what matters is when it will actually go out.
        meta: `${item.type === 'unpublish' ? 'Dépublication' : 'Publication'} · part le ${formatDate(item.goesOutAt)}`,
        title: item.label,
      }))}
      title="Publications programmées"
    />
  )
}
