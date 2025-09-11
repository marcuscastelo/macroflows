// Removed OpenTelemetry dependencies
// Stub implementations to prevent crashes during migration

// Removed unused import

type TelemetryEnvironment = 'development' | 'staging' | 'production'

export const getTelemetryEnvironment = (): TelemetryEnvironment => {
  if (import.meta.env.PROD) return 'production'
  if (import.meta.env.MODE === 'staging') return 'staging'
  return 'development'
}

let isInitialized = false

export const initializeTelemetry = (): void => {
  if (isInitialized) {
    console.warn('OpenTelemetry already initialized')
    return
  }

  console.info('OpenTelemetry initialization skipped (removed)')
  isInitialized = false
}

export const getTracer = (_name = 'macroflows-web-tracer') => {
  // Return stub tracer
  return null
}

export const isTracingEnabled = (): boolean => {
  return false // Always disabled now
}
