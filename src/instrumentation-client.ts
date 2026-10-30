import { init } from '@sentry/nextjs'

import { dropConsoleBreadcrumb, scrubEvent, sentryOptions } from '@/lib/sentry'

init({
  ...sentryOptions,
  beforeBreadcrumb: dropConsoleBreadcrumb,
  beforeSend: scrubEvent,
  // Session tracking asks Sentry to read the visitor's IP from the connection.
  integrations: (defaults) => defaults.filter(({ name }) => name !== 'BrowserSession'),
})
