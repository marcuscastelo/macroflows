import * as Sentry from '@sentry/solidstart'
import { solidRouterBrowserTracingIntegration } from '@sentry/solidstart/solidrouter'

import { createSentryConfig } from '~/modules/observability/infrastructure/sentry/config'

let isInitialized = false

export function initializeSentry(type: 'server' | 'client') {
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
          ? [
              solidRouterBrowserTracingIntegration(),
              Sentry.browserTracingIntegration(),
              Sentry.browserProfilingIntegration(),
              Sentry.replayIntegration({
                maskAllText: false,
                maskAllInputs: false,
              }),
            ]
          : [],

      // Session Replay configuration
      replaysSessionSampleRate: 1.0,
      replaysOnErrorSampleRate: 1.0,

      // Set sample rate for profiling
      profilesSampleRate: 1.0,
    })

    isInitialized = true
  } catch (error) {
    console.error('Failed to initialize Sentry:', error)
    // Don't throw - Sentry should not break the application
  }
}
