import { APP_VERSION } from '~/app-version'

export type SentryEnvironment = 'development' | 'staging' | 'production'

export type SentrySampleRates = {
  traces: number
  replays: number
  replaysOnError: number
  profiles: number
}

export type SentryConfig = {
  dsn?: string
  release: string
  useOTel: boolean
  environment: SentryEnvironment
  sampleRates: SentrySampleRates
}

export type EnvVars = {
  VITE_SENTRY_DSN?: string
  VITE_SENTRY_ENVIRONMENT?: string
  VITE_SENTRY_TRACES_SAMPLE_RATE?: string | number
  VITE_SENTRY_REPLAYS_SAMPLE_RATE?: string | number
  VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE?: string | number
  VITE_SENTRY_PROFILES_SAMPLE_RATE?: string | number
}

export function getEnvironment(envVar?: string): SentryEnvironment {
  if (envVar === 'production' || envVar === 'staging') {
    return envVar
  }
  return 'development'
}

export function getDefaultSampleRates(environment: SentryEnvironment): SentrySampleRates {
  switch (environment) {
    case 'production':
      return {
        traces: 0.1,
        replays: 0.1,
        replaysOnError: 1.0,
        profiles: 0.1,
      }
    case 'staging':
      return {
        traces: 0.5,
        replays: 0.5,
        replaysOnError: 1.0,
        profiles: 0.5,
      }
    case 'development':
    default:
      return {
        traces: 1.0,
        replays: 1.0,
        replaysOnError: 1.0,
        profiles: 1.0,
      }
  }
}

export function parseRate(value: unknown, defaultValue: number): number {
  if (typeof value === 'number') return Math.max(0, Math.min(1, value))
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    if (!isNaN(parsed)) return Math.max(0, Math.min(1, parsed))
  }
  return defaultValue
}

export function getSampleRates(environment: SentryEnvironment, env: EnvVars): SentrySampleRates {
  const defaults = getDefaultSampleRates(environment)

  return {
    traces: parseRate(env.VITE_SENTRY_TRACES_SAMPLE_RATE, defaults.traces),
    replays: parseRate(env.VITE_SENTRY_REPLAYS_SAMPLE_RATE, defaults.replays),
    replaysOnError: parseRate(env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE, defaults.replaysOnError),
    profiles: parseRate(env.VITE_SENTRY_PROFILES_SAMPLE_RATE, defaults.profiles),
  }
}

export function createSentryConfig(env: EnvVars = import.meta.env): SentryConfig {
  const release = `macroflows@${APP_VERSION}`
  const environment = getEnvironment(env.VITE_SENTRY_ENVIRONMENT)

  return {
    dsn:
      typeof env.VITE_SENTRY_DSN === 'string'
        ? env.VITE_SENTRY_DSN
        : undefined,
    release,
    useOTel: false,
    environment,
    sampleRates: getSampleRates(environment, env),
  }
}
