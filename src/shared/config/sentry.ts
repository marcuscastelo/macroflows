import * as Sentry from '@sentry/solidstart'
import { solidRouterBrowserTracingIntegration } from '@sentry/solidstart/solidrouter'

import { APP_VERSION } from '~/app-version'

type SentryEnvironment = 'development' | 'staging' | 'production'

type SentryConfig = {
  dsn?: string
  environment: SentryEnvironment
  tracesSampleRate: number
  release: string
  enableProfiling: boolean
}

const getSentryEnvironment = (): SentryEnvironment => {
  if (import.meta.env.PROD) return 'production'
  if (import.meta.env.MODE === 'staging') return 'staging'
  return 'development'
}

const createSentryConfig = (): SentryConfig => {
  const environment = getSentryEnvironment()

  return {
    dsn:
      typeof import.meta.env.VITE_SENTRY_DSN === 'string'
        ? import.meta.env.VITE_SENTRY_DSN
        : undefined,
    environment,
    tracesSampleRate: environment === 'development' ? 1.0 : 0.1,
    release: `macroflows@${APP_VERSION}`,
    enableProfiling: environment !== 'development',
  }
}

let isInitialized = false

export const initializeSentry = (): void => {
  if (isInitialized) {
    console.warn('Sentry already initialized')
    return
  }

  try {
    const config = createSentryConfig()

    // Only initialize if DSN is provided
    if (config.dsn === undefined || config.dsn === '') {
      console.warn('❌ Sentry DSN not provided - skipping initialization', {
        VITE_SENTRY_DSN: String(import.meta.env.VITE_SENTRY_DSN),
        environment: config.environment,
      })
      return
    }

    console.log(
      '🚀 Initializing Sentry with DSN:',
      config.dsn.substring(0, 20) + '...',
    )

    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,
      release: config.release,
      tracesSampleRate: config.tracesSampleRate,

      // SolidStart specific configuration
      sendDefaultPii: true,
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/.*\.supabase\.co/,
        /^https:\/\/.*\.macroflows\.app/,
      ],

      integrations: [
        solidRouterBrowserTracingIntegration(),
        Sentry.replayIntegration(),
      ],

      // Session Replay configuration
      replaysSessionSampleRate:
        config.environment === 'development' ? 1.0 : 0.1,
      replaysOnErrorSampleRate: 1.0,

      // Set sample rate for profiling
      profilesSampleRate: config.enableProfiling ? 0.1 : 0,

      // Enhanced error context
      beforeSend: (event, hint) => {
        // Add OpenTelemetry trace context if available
        const error = hint.originalException
        if (
          error !== undefined &&
          error !== null &&
          typeof error === 'object' &&
          'traceId' in error &&
          'spanId' in error
        ) {
          event.tags = {
            ...event.tags,
            'otel.trace_id': String(error.traceId),
            'otel.span_id': String(error.spanId),
          }

          event.contexts = {
            ...event.contexts,
            trace: {
              trace_id: String(error.traceId),
              span_id: String(error.spanId),
            },
          }
        }

        return event
      },
    })

    isInitialized = true

    if (config.environment === 'development') {
      console.info('🎯 Sentry initialized successfully', {
        dsn: config.dsn.substring(0, 20) + '...',
        environment: config.environment,
        release: config.release,
        tracesSampleRate: config.tracesSampleRate,
      })
    }
  } catch (error) {
    console.error('Failed to initialize Sentry:', error)
    // Don't throw - Sentry should not break the application
  }
}

export const isSentryEnabled = (): boolean => {
  return isInitialized
}

/**
 * Manually capture an exception with additional context
 */
export const captureException = (
  error: Error,
  context?: Record<string, unknown>,
): void => {
  if (!isInitialized) return

  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, { [key]: value })
      })
    }
    Sentry.captureException(error)
  })
}

/**
 * Set user context for error tracking
 */
export const setUserContext = (user: {
  id: string | number
  email?: string
  name?: string
}): void => {
  if (!isInitialized) return

  Sentry.setUser({
    id: String(user.id),
    email: user.email,
    username: user.name,
  })
}

/**
 * Add breadcrumb for user actions tracking
 */
export const addBreadcrumb = (
  message: string,
  category: string,
  data?: Record<string, unknown>,
): void => {
  if (!isInitialized) return

  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
    timestamp: Date.now() / 1000,
  })
}

/**
 * Start a new transaction for performance monitoring
 */
export const startTransaction = (
  name: string,
  op: string,
  data?: Record<string, unknown>,
) => {
  if (!isInitialized) return null

  return Sentry.startSpan(
    {
      name,
      op,
      attributes: data
        ? Object.fromEntries(
            Object.entries(data).map(([key, value]) => [
              key,
              typeof value === 'string' ||
              typeof value === 'number' ||
              typeof value === 'boolean'
                ? value
                : String(value),
            ]),
          )
        : undefined,
    },
    (span) => span,
  )
}
