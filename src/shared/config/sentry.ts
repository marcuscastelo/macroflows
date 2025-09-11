// Removed Sentry and OpenTelemetry dependencies
// Stub implementations to prevent crashes during migration

type SentryEnvironment = 'development' | 'staging' | 'production'
const _getSentryEnvironment = (): SentryEnvironment => {
  if (import.meta.env.PROD) return 'production'
  if (import.meta.env.MODE === 'staging') return 'staging'
  return 'development'
}

let isInitialized = false

const initializeSentry = (): void => {
  if (isInitialized) {
    console.warn('Sentry already initialized')
    return
  }

  // Stub - no longer initializing Sentry
  console.log('Sentry initialization skipped (removed)')
  isInitialized = false
}

const isSentryEnabled = (): boolean => {
  return false // Always disabled now
}

/**
 * Stub - no longer capturing exceptions
 */
const captureException = (
  _error: Error,
  _context?: Record<string, unknown>,
): void => {
  // No-op stub
}

/**
 * Stub - no longer setting user context
 */
const setUserContext = (_user: {
  id: string | number
  email?: string
  name?: string
}): void => {
  // No-op stub
}

/**
 * Stub - no longer adding breadcrumbs
 */
const addBreadcrumb = (
  _message: string,
  _category: string,
  _data?: Record<string, unknown>,
  _level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
): void => {
  // No-op stub
}

/**
 * Convert console operations to breadcrumbs for better error context
 */
const logToBreadcrumb = (
  message: string,
  level: 'error' | 'warning' | 'info' = 'info',
  data?: Record<string, unknown>,
): void => {
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
 * Stub - no longer starting spans
 */
const startSpanManual = (
  _name: string,
  _op: string,
  _data?: Record<string, unknown>,
) => {
  return null // Always return null
}

export const sentry = {
  initializeSentry,
  isSentryEnabled,
  captureException,
  setUserContext,
  addBreadcrumb,
  logToBreadcrumb,
  startSpanManual,
}
