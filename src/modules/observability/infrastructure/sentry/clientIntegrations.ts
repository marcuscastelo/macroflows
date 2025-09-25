import * as Sentry from '@sentry/solidstart'

export async function createClientIntegrations() {
  const { solidRouterBrowserTracingIntegration } = await import(
    '@sentry/solidstart/solidrouter'
  )

  return [
    solidRouterBrowserTracingIntegration(),
    Sentry.browserTracingIntegration({
      traceFetch: true,
      traceXHR: true,
    }),
    Sentry.browserProfilingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      maskAllInputs: false,
    }),
    Sentry.consoleLoggingIntegration(),
  ]
}
