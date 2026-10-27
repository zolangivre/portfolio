import type { CollectionConfig } from 'payload'

/**
 * Drafts, autosave and scheduled publishing, shared by the collections the
 * site renders as content. A factory, like the shared fields: Payload mutates
 * the config while sanitizing it.
 *
 * Scheduled publishes are jobs, and the only thing that runs jobs is the
 * daily Vercel cron (`vercel.json`; the Hobby plan allows one run a day). A
 * date picked in the admin is therefore a "not before": the document goes out
 * on the next run after it. The picker uses a 24-hour clock in 30-minute
 * steps — finer steps would promise a precision the cron doesn't have.
 * Vercel only fires crons on the production deployment: on staging, a
 * scheduled publish waits until an editor calls the endpoint by hand.
 */
export const draftVersions = (): CollectionConfig['versions'] => ({
  drafts: {
    autosave: true,
    schedulePublish: { timeFormat: 'HH:mm', timeIntervals: 30 },
  },
})

/** Appended to the admin description of every collection with drafts. */
export const SCHEDULE_HINT =
  ' Une publication programmée part au passage quotidien de 7 h UTC qui suit l’heure choisie.'
