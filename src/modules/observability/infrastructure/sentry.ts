import { trace } from '@opentelemetry/api'
import * as Sentry from '@sentry/solidstart'

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

  // Use build-time release from environment, fallback to app version
  const release =
    typeof import.meta.env.VITE_SENTRY_RELEASE === 'string' &&
    import.meta.env.VITE_SENTRY_RELEASE !== ''
      ? import.meta.env.VITE_SENTRY_RELEASE
      : `macroflows@${APP_VERSION}`

  return {
    dsn:
      typeof import.meta.env.VITE_SENTRY_DSN === 'string'
        ? import.meta.env.VITE_SENTRY_DSN
        : undefined,
    environment,
    tracesSampleRate: environment === 'development' ? 1.0 : 1.0,
    release,
    enableProfiling: environment !== 'development',
  }
}

let isInitialized = false

const initializeSentry = (): void => {
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
        /^https:\/\/.*\.macroflows.*\.app/,
      ],

      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],

      // Session Replay configuration
      replaysSessionSampleRate:
        config.environment === 'development' ? 1.0 : 1.0,
      replaysOnErrorSampleRate: 1.0,

      // Set sample rate for profiling
      profilesSampleRate: config.enableProfiling ? 1.0 : 0,

      // Enhanced error context and filtering
      beforeSend: (event, hint) => {
        // Filter out development-only errors in production
        if (config.environment === 'production') {
          // Filter out network outage errors that create noise
          const error = hint.originalException
          if (
            error !== null &&
            typeof error === 'object' &&
            'message' in error
          ) {
            const message = String(error.message).toLowerCase()
            if (
              message.includes('failed to fetch') ||
              message.includes('networkerror') ||
              message.includes('cors') ||
              message.includes('net::err')
            ) {
              // Only sample network errors to reduce noise
              if (Math.random() > 0.1) return null
            }
          }

          // Filter out specific development patterns
          if (
            (event.message?.includes('ref is not defined') ?? false) ||
            (event.message?.includes('Error processing promise') ?? false)
          ) {
            return null
          }
        }

        // Add OpenTelemetry trace context if available
        // First try to get trace context from active span (most accurate)
        const activeSpan = trace.getActiveSpan()
        if (activeSpan) {
          const spanContext = activeSpan.spanContext()
          if (spanContext.traceId && spanContext.spanId) {
            event.tags = {
              ...event.tags,
              'otel.trace_id': spanContext.traceId,
              'otel.span_id': spanContext.spanId,
            }

            event.contexts = {
              ...event.contexts,
              trace: {
                trace_id: spanContext.traceId,
                span_id: spanContext.spanId,
              },
            }
          }
        } else {
          // Fallback: check if error object has trace context
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

const isSentryEnabled = (): boolean => {
  return isInitialized
}

/**
 * Manually capture an exception with additional context
 */
const captureException = (
  error: Error,
  context?: Record<string, unknown>,
): void => {
  if (!isInitialized) return

  Sentry.withScope((scope) => {
    if (context) {
      // Set tags for better grouping and filtering
      const tags: Record<string, string> = {}
      const contexts: Record<string, Record<string, unknown>> = {}

      Object.entries(context).forEach(([key, value]) => {
        // Convert key values to tags for better filtering
        if (
          [
            'severity',
            'module',
            'component',
            'operation',
            'entityType',
          ].includes(key) &&
          (typeof value === 'string' || typeof value === 'number')
        ) {
          tags[key] = String(value)
        } else if (
          key === 'traceContext' &&
          typeof value === 'object' &&
          value !== null &&
          'traceId' in value &&
          'spanId' in value
        ) {
          // Handle trace context specially
          if (
            'traceId' in value &&
            typeof value.traceId === 'string' &&
            value.traceId !== '' &&
            'spanId' in value &&
            typeof value.spanId === 'string' &&
            value.spanId !== ''
          ) {
            const traceId = value.traceId
            const spanId = value.spanId
            tags['otel.trace_id'] = traceId
            tags['otel.span_id'] = spanId
            contexts.trace = {
              trace_id: traceId,
              span_id: spanId,
            }
          }
        } else {
          // Set as context for detailed information
          if (typeof value === 'object' && value !== null) {
            // Safely cast object to record
            const record: Record<string, unknown> = {}
            Object.entries(value).forEach(([k, v]) => {
              record[k] = v
            })
            contexts[key] = record
          } else {
            contexts[key] = { [key]: value }
          }
        }
      })

      // Apply tags and contexts
      Object.entries(tags).forEach(([key, value]) => {
        scope.setTag(key, value)
      })

      Object.entries(contexts).forEach(([key, value]) => {
        scope.setContext(key, value)
      })

      // Custom fingerprinting for better error grouping
      const fingerprint = ['{{ default }}']
      if ((tags.component ?? '') !== '' && (tags.operation ?? '') !== '') {
        fingerprint.push(`${tags.component}::${tags.operation}`)
      } else if ((tags.component ?? '') !== '') {
        const component = tags.component
        if (component !== undefined) {
          fingerprint.push(component)
        }
      }
      if ((tags.module ?? '') !== '') {
        const module = tags.module
        if (module !== undefined) {
          fingerprint.push(module)
        }
      }
      scope.setFingerprint(fingerprint)

      // Set error level based on severity
      const level = tags.severity ?? 'error'
      const validLevels = [
        'fatal',
        'error',
        'warning',
        'info',
        'debug',
      ] as const
      type ValidLevel = (typeof validLevels)[number]

      const isValidLevel = (l: string): l is ValidLevel => {
        const levels: readonly string[] = validLevels
        return levels.includes(l)
      }

      if (isValidLevel(level)) {
        scope.setLevel(level)
      } else {
        scope.setLevel('error')
      }
    }

    Sentry.captureException(error)
  })
}

/**
 * Set user context for error tracking
 */
const setUserContext = (user: {
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
const addBreadcrumb = (
  message: string,
  category: string,
  data?: Record<string, unknown>,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
): void => {
  if (!isInitialized) return

  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level,
    timestamp: Date.now() / 1000,
  })
}

/**
 * Convert console operations to breadcrumbs for better error context
 */
const logToBreadcrumb = (
  message: string,
  level: 'error' | 'warning' | 'info' = 'info',
  data?: Record<string, unknown>,
): void => {
  addBreadcrumb(message, 'console', data, level)

  // Still log to console in development
  if (import.meta.env.DEV) {
    if (level === 'error') {
      console.error(message, data)
    } else if (level === 'warning') {
      console.warn(message, data)
    } else {
      console.info(message, data)
    }
  }
}

/**
 * Start a new transaction for performance monitoring
 */
const startTransaction = (
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

export const sentry = {
  initializeSentry,
  isSentryEnabled,
  captureException,
  setUserContext,
  addBreadcrumb,
  logToBreadcrumb,
  startTransaction,
}
