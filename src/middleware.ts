import { sentryBeforeResponseMiddleware } from '@sentry/solidstart'
import { createMiddleware } from '@solidjs/start/middleware'

import { tracingMiddleware } from '~/shared/middleware/tracingMiddleware'

export default createMiddleware({
  onBeforeResponse: [
    sentryBeforeResponseMiddleware(),
    tracingMiddleware,
  ],
})
