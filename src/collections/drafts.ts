import { APIError, type CollectionBeforeChangeHook } from 'payload'

/**
 * Drafts, autosave and scheduled publishing, shared by the collections the
 * site renders as content and by every global. A factory, like the shared
 * fields: Payload mutates the config while sanitizing it. Untyped on purpose:
 * the literal fits both CollectionConfig['versions'] and GlobalConfig's.
 *
 * Scheduled publishes are jobs, and the only thing that runs jobs is the
 * daily Vercel cron (`vercel.json`; the Hobby plan allows one run a day). A
 * date picked in the admin is therefore a "not before": the document goes out
 * on the next run after it. The picker uses a 24-hour clock in 30-minute
 * steps — finer steps would promise a precision the cron doesn't have.
 * Vercel only fires crons on the production deployment: on staging, a
 * scheduled publish waits until an editor calls the endpoint by hand.
 */
export const draftVersions = () => ({
  drafts: {
    autosave: true,
    schedulePublish: { timeFormat: 'HH:mm', timeIntervals: 30 },
  },
})

/** Appended to the admin description of everything with drafts. */
export const SCHEDULE_HINT =
  ' Une publication programmée part au passage quotidien de 7 h UTC qui suit l’heure choisie.'

/**
 * The globals' version: their scheduled unpublish is refused
 * (refuseGlobalUnpublishSchedule), and the admin only shows a generic error
 * when that happens, so the description says it up front.
 */
export const GLOBAL_SCHEDULE_HINT =
  SCHEDULE_HINT + ' Un global ne se dépublie pas : seule la publication se programme.'

/**
 * Hides "Unpublish" on globals. The site always renders a global's main row;
 * unpublishing writes the latest draft into that row, so the site would show
 * text nobody published. A global goes back to an earlier state through its
 * version history instead.
 */
export const hideUnpublishButton = () => ({
  elements: { UnpublishButton: '/components/admin/NoUnpublishButton#NoUnpublishButton' },
})

/**
 * Refuses to schedule the unpublishing of a global — the schedule drawer
 * still offers it with the button hidden. The job would write the latest
 * draft into the row the site renders (see hideUnpublishButton). Runs on the
 * jobs collection, which needs `jobs.runHooks` (payload.config.ts).
 */
export const refuseGlobalUnpublishSchedule: CollectionBeforeChangeHook = ({ data, operation }) => {
  const input = data.input as { global?: string; type?: string } | undefined

  if (
    operation === 'create' &&
    data.taskSlug === 'schedulePublish' &&
    input?.global &&
    input.type === 'unpublish'
  ) {
    throw new APIError(
      'Un global ne se dépublie pas : programmez plutôt la publication d’une autre version.',
      400,
      undefined,
      true,
    )
  }

  return data
}
