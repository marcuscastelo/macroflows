// @refresh reload
import { mount, StartClient } from '@solidjs/start/client'

import { createTelemetry } from '~/modules/observability/application/telemetry'

const telemetry = createTelemetry()
telemetry.initializeTelemetry('client')

mount(() => <StartClient />, document.getElementById('app')!)
