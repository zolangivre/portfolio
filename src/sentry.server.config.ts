import { captureConsoleIntegration, init } from '@sentry/nextjs'

import { dropConsoleBreadcrumb, scrubEvent, sentryOptions } from '@/lib/sentry'

init({
  ...sentryOptions,
  beforeBreadcrumb: dropConsoleBreadcrumb,
  beforeSend: scrubEvent,
  // The queries catch their errors and render an empty page instead of
  // failing, so a broken database throws nothing: `console.error` in
  // src/lib/queries is the only trace it leaves.
  integrations: [captureConsoleIntegration({ levels: ['error'] })],
})
