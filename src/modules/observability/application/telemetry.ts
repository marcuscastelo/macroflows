import { type createSentryService } from '~/modules/observability/infrastructure/sentry/sentry'

export type TelemetryDeps = {
  sentryService: ReturnType<typeof createSentryService>
}

export function createTelemetry(deps: TelemetryDeps) {
  function initializeTelemetry(type: 'server' | 'client') {
    void deps.sentryService.initializeSentry(type)
  }

  return {
    initializeTelemetry,
  }
}

export type TelemetryModule = ReturnType<typeof createTelemetry>
