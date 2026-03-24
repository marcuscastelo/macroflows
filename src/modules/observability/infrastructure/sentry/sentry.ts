import * as Sentry from '@sentry/solidstart'

import { APP_VERSION } from '~/app-version'

type SentryConfig = {
  dsn?: string
  release: string
  useOTel: boolean
}

function createSentryConfig(): SentryConfig {
  const release = `macroflows@${APP_VERSION}`

  return {
    dsn:
      typeof import.meta.env.VITE_SENTRY_DSN === 'string'
        ? import.meta.env.VITE_SENTRY_DSN
        : undefined,
    release,
    useOTel: false,
  }
}

async function createClientIntegrations() {
  const { solidRouterBrowserTracingIntegration } =
    await import('@sentry/solidstart/solidrouter')

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

async function setupSentryOTelIntegration(type: 'server' | 'client') {
  const client = Sentry.getClient()
  if (client === undefined) {
    console.warn('Sentry OTel Fatal Error: Sentry client is undefined')
    return
  }

  const { context, propagation, trace } = await import('@opentelemetry/api')
  const { BasicTracerProvider } = await import('@opentelemetry/sdk-trace-base')
  const SentryOTel = await import('@sentry/opentelemetry')

  SentryOTel.setupEventContextTrace(client)

  const provider = new BasicTracerProvider({
    sampler: new SentryOTel.SentrySampler(client),
    spanProcessors: [new SentryOTel.SentrySpanProcessor()],
  })

  const SentryContextManager = await wrapContextManagerClass(type)

  trace.setGlobalTracerProvider(provider)
  propagation.setGlobalPropagator(new SentryOTel.SentryPropagator())
  context.setGlobalContextManager(new SentryContextManager())

  SentryOTel.setOpenTelemetryContextAsyncContextStrategy()
}

async function wrapContextManagerClass(type: 'server' | 'client') {
  const SentryOTel = await import('@sentry/opentelemetry')

  if (type === 'client') {
    const { ZoneContextManager } = await import('@opentelemetry/context-zone')
    return SentryOTel.wrapContextManagerClass(ZoneContextManager)
  }

  const { AsyncLocalStorageContextManager } =
    await import('@opentelemetry/context-async-hooks')
  return SentryOTel.wrapContextManagerClass(AsyncLocalStorageContextManager)
}

export function createSentryService(deps?: {
  createSentryConfig?: typeof createSentryConfig
  createClientIntegrations?: typeof createClientIntegrations
  setupSentryOTelIntegration?: typeof setupSentryOTelIntegration
}) {
  const localCreateSentryConfig = deps?.createSentryConfig ?? createSentryConfig
  const localCreateClientIntegrations =
    deps?.createClientIntegrations ?? createClientIntegrations
  const localSetupSentryOTelIntegration =
    deps?.setupSentryOTelIntegration ?? setupSentryOTelIntegration
  let isInitialized = false

  async function initializeSentry(type: 'server' | 'client') {
    if (isInitialized) {
      console.warn('Sentry already initialized')
      return
    }

    try {
      const config = localCreateSentryConfig()

      // Only initialize if DSN is provided
      if (config.dsn === undefined || config.dsn === '') {
        console.warn('❌ Sentry DSN not provided - skipping initialization', {
          VITE_SENTRY_DSN: String(import.meta.env.VITE_SENTRY_DSN),
        })
        return
      }

      console.log(
        '🚀 Initializing Sentry with DSN:',
        config.dsn.substring(0, 20) + '...',
      )

      Sentry.init({
        dsn: config.dsn,
        release: config.release,
        tracesSampleRate: 1.0,

        // SolidStart specific configuration
        sendDefaultPii: true,
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/.*\.supabase\.co/,
          /^https:\/\/.*\.macroflows\.app/,
          /^https:\/\/.*\.macroflows.*\.app/,
        ],

        integrations:
          type === 'client'
            ? await localCreateClientIntegrations()
            : [Sentry.consoleLoggingIntegration()],

        // Session Replay configuration
        replaysSessionSampleRate: 1.0,
        replaysOnErrorSampleRate: 1.0,

        // Set sample rate for profiling
        profilesSampleRate: 1.0,

        enableLogs: true,
      })

      if (config.useOTel) {
        await localSetupSentryOTelIntegration(type)
      }

      isInitialized = true
    } catch (error) {
      console.error('Failed to initialize Sentry:', error)
      // Don't throw - Sentry should not break the application
    }
  }

  return {
    initializeSentry,
  }
}
