// @refresh reload
import { mount, StartClient } from '@solidjs/start/client'

import { initializeAppTelemetry } from '~/di/container'

initializeAppTelemetry('client')

mount(() => <StartClient />, document.getElementById('app')!)
