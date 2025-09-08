import { trace } from '@opentelemetry/api'
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'

import { APP_VERSION } from '~/app-version'

type TelemetryEnvironment = 'development' | 'staging' | 'production'

type TelemetryConfig = {
  serviceName: string
  serviceVersion: string
  environment: TelemetryEnvironment
  enableConsoleExporter: boolean
  enableOTLPExporter: boolean
  otlpEndpoint?: string
  sampleRate: number
  sentryDsn?: string
}

export const getTelemetryEnvironment = (): TelemetryEnvironment => {
  if (import.meta.env.PROD) return 'production'
  if (import.meta.env.MODE === 'staging') return 'staging'
  return 'development'
}

const createTelemetryConfig = (): TelemetryConfig => {
  const environment = getTelemetryEnvironment()

  return {
    serviceName: 'macroflows-web',
    serviceVersion: String(APP_VERSION),
    environment,
    enableConsoleExporter: environment === 'development',
    enableOTLPExporter: environment !== 'development',
    otlpEndpoint:
      typeof import.meta.env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT === 'string'
        ? import.meta.env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT
        : undefined,
    sampleRate: environment === 'development' ? 1.0 : 0.1,
    sentryDsn:
      typeof import.meta.env.VITE_SENTRY_DSN === 'string'
        ? import.meta.env.VITE_SENTRY_DSN
        : undefined,
  }
}

function createTracerProvider(_config: TelemetryConfig): WebTracerProvider {
  const provider = new WebTracerProvider()

  // For now, we'll use the basic provider
  // The auto-instrumentations will handle most of the tracing
  // Custom exporters and resources can be added later when needed

  return provider
}

const setupAutoInstrumentations = (): void => {
  registerInstrumentations({
    instrumentations: [
      getWebAutoInstrumentations({
        '@opentelemetry/instrumentation-fetch': {
          // Instrument fetch requests
          propagateTraceHeaderCorsUrls: [
            /https:\/\/.*\.supabase\.co/,
            /http:\/\/localhost.*/,
          ],
          clearTimingResources: true,
        },
        '@opentelemetry/instrumentation-user-interaction': {
          // Instrument user interactions
          eventNames: ['click', 'submit', 'keydown'],
        },
        '@opentelemetry/instrumentation-document-load': {
          // Instrument document loading
        },
      }),
    ],
  })
}

let isInitialized = false

export const initializeTelemetry = (): void => {
  if (isInitialized) {
    console.warn('OpenTelemetry already initialized')
    return
  }

  try {
    const config = createTelemetryConfig()

    if (config.environment === 'development') {
      console.info('Initializing OpenTelemetry in development mode', {
        serviceName: config.serviceName,
        version: config.serviceVersion,
        sampleRate: config.sampleRate,
      })
    }

    // Create and register tracer provider
    const provider = createTracerProvider(config)
    provider.register()

    // Set up auto-instrumentations
    setupAutoInstrumentations()

    isInitialized = true

    if (config.environment === 'development') {
      console.info('OpenTelemetry initialization complete')
    }
  } catch (error: unknown) {
    console.error('Failed to initialize OpenTelemetry:', error)
    // Don't throw - telemetry should not break the application
  }
}

export const getTracer = (name = 'macroflows-web-tracer') => {
  return trace.getTracer(name)
}

export const isTracingEnabled = (): boolean => {
  return isInitialized
}
