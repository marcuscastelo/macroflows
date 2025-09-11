import { APP_VERSION } from '~/app-version'

export type SentryConfig = {
  dsn?: string
  release: string
}

export function createSentryConfig(): SentryConfig {
  const release = `macroflows@${APP_VERSION}`

  return {
    dsn:
      typeof import.meta.env.VITE_SENTRY_DSN === 'string'
        ? import.meta.env.VITE_SENTRY_DSN
        : undefined,
    release,
  }
}
