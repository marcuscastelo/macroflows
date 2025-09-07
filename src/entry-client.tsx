// @refresh reload
import { mount, StartClient } from '@solidjs/start/client'

import { initializeSentry } from '~/shared/config/sentry'
import { initializeTelemetry } from '~/shared/config/telemetry'

// Initialize observability stack before mounting the application
initializeSentry()
initializeTelemetry()

mount(() => <StartClient />, document.getElementById('app')!)
