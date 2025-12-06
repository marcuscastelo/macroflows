import { createTelemetry } from '~/modules/observability/application/telemetry'

const telemetry = createTelemetry()
telemetry.initializeTelemetry('server')
