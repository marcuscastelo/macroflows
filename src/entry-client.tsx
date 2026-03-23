// @refresh reload
import { mount, StartClient } from '@solidjs/start/client'

import { useCases } from '~/di/useCases'

useCases.telemetryUseCases().initializeTelemetry('client')

mount(() => <StartClient />, document.getElementById('app')!)
