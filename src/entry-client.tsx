// @refresh reload
import { mount, StartClient } from '@solidjs/start/client'

import { sentry } from '~/shared/config/sentry'
import { initializeTelemetry } from '~/shared/config/telemetry'
import { webVitals } from '~/shared/config/webVitals'

// Initialize observability stack before mounting the application
sentry.initializeSentry()
initializeTelemetry()
webVitals.initialize()

mount(() => <StartClient />, document.getElementById('app')!)
