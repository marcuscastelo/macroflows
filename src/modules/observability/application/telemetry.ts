export type TelemetryDeps = {
  sentryService: {
    initializeSentry: (type: 'server' | 'client') => Promise<void> | void
  }
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
