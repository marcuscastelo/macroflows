import { type initializeSentry as defaultInitializeSentry } from '~/modules/observability/infrastructure/sentry/sentry'

export type TelemetryDeps = {
  initializeSentry: typeof defaultInitializeSentry
}

export function createTelemetry(deps: TelemetryDeps) {
  function initializeTelemetry(type: 'server' | 'client') {
    void deps.initializeSentry(type)
  }

  return {
    initializeTelemetry,
  }
}

export type TelemetryModule = ReturnType<typeof createTelemetry>
