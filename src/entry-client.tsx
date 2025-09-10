// @refresh reload
import { mount, StartClient } from '@solidjs/start/client'

import { sentry } from '~/shared/config/sentry'
import { initializeTelemetry } from '~/shared/config/telemetry'

// Initialize observability stack before mounting the application
sentry.initializeSentry()
initializeTelemetry()

mount(() => <StartClient />, document.getElementById('app')!)
