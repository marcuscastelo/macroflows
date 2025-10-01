// @refresh reload
import { mount, StartClient } from '@solidjs/start/client'

import { initializeTelemetry } from '~/modules/observability/application/telemetry'

initializeTelemetry('client')

mount(() => <StartClient />, document.getElementById('app')!)
