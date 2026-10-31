import type { Breadcrumb, ErrorEvent } from '@sentry/nextjs'

/**
 * What every runtime tells Sentry (sentry.server.config.ts, sentry.edge.config.ts,
 * instrumentation-client.ts). No DSN, as in local development and the tests,
 * means the SDK stays off.
 *
 * Errors only leave with their SQL values removed. Drizzle ends a failed
 * query's message with `params: …`, and for a contact message those are the
 * visitor's name, email and text, none of which belongs in a third party. So
 * is a visitor's IP address, which the server SDK attaches to the request.
 *
 * No `tracesSampleRate`, and it has to stay that way: performance spans skip
 * `beforeSend`, and a server span carries the whole request body and the IP,
 * so a sampled contact form would send its name, email and message as they are.
 */
export const sentryOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV,
}

const withoutQueryParams = (text: string) => text.replace(/\s*params:[\s\S]*$/, '')

/**
 * `beforeSend`: strips the SQL values from the exception and message texts,
 * drops `extra.arguments`, where captureConsoleIntegration copies what was
 * logged, the error itself included, and keeps only the method and URL of the
 * request: no user, no headers, no body.
 */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  for (const exception of event.exception?.values ?? []) {
    if (exception.value) exception.value = withoutQueryParams(exception.value)
  }

  if (event.message) event.message = withoutQueryParams(event.message)
  if (event.extra) delete event.extra.arguments

  delete event.user
  if (event.request) {
    event.request = { method: event.request.method, url: event.request.url }
  }

  return event
}

/** `beforeBreadcrumb`: console lines hold the same errors, so they stay out too. */
export const dropConsoleBreadcrumb = (breadcrumb: Breadcrumb) =>
  breadcrumb.category === 'console' ? null : breadcrumb
