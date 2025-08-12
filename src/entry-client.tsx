// @refresh reload
import { mount, StartClient } from '@solidjs/start/client'

import { initializeTelemetry } from '~/shared/config/telemetry'

// Initialize OpenTelemetry before mounting the application
initializeTelemetry()

mount(() => <StartClient />, document.getElementById('app')!)
