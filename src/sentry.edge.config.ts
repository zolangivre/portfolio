import { init } from '@sentry/nextjs'

import { dropConsoleBreadcrumb, scrubEvent, sentryOptions } from '@/lib/sentry'

// The edge runtime only runs src/proxy.ts, which reads no content.
init({
  ...sentryOptions,
  beforeBreadcrumb: dropConsoleBreadcrumb,
  beforeSend: scrubEvent,
})
