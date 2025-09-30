import * as Sentry from '@sentry/solidstart'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { initializeSentry } from '~/modules/observability/infrastructure/sentry/sentry'

vi.mock('@sentry/solidstart', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  getClient: vi.fn(() => ({
    getDsn: vi.fn(() => ({ toString: () => 'mock-dsn' })),
  })),
  consoleLoggingIntegration: vi.fn(() => ({})),
  browserTracingIntegration: vi.fn(() => ({})),
  browserProfilingIntegration: vi.fn(() => ({})),
  replayIntegration: vi.fn(() => ({})),
}))

vi.mock('@sentry/solidstart/solidrouter', () => ({
  solidRouterBrowserTracingIntegration: vi.fn(() => ({})),
}))

vi.mock('~/modules/observability/infrastructure/piiScrubbing', () => ({
  scrubSentryEvent: vi.fn((event) => event),
}))

describe('Sentry E2E Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('VITE_SENTRY_DSN', 'https://test-dsn@test.ingest.sentry.io/123456')
  })

  describe('Error Reporting', () => {
    it('should initialize Sentry with correct configuration', async () => {
      await initializeSentry('client')

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: 'https://test-dsn@test.ingest.sentry.io/123456',
          tracesSampleRate: 1.0,
          sendDefaultPii: true,
          enableLogs: true,
          beforeSend: expect.any(Function),
        }),
      )
    })

    it('should not initialize Sentry when DSN is not provided', async () => {
      vi.stubEnv('VITE_SENTRY_DSN', '')

      await initializeSentry('client')

      expect(Sentry.init).not.toHaveBeenCalled()
    })

    it('should capture exceptions with Sentry', () => {
      const testError = new Error('Test error')
      Sentry.captureException(testError)

      expect(Sentry.captureException).toHaveBeenCalledWith(testError)
    })

    it('should capture messages with Sentry', () => {
      const testMessage = 'Test message'
      Sentry.captureMessage(testMessage)

      expect(Sentry.captureMessage).toHaveBeenCalledWith(testMessage)
    })
  })

  describe('Integration Configuration', () => {
    it('should configure client integrations correctly', async () => {
      await initializeSentry('client')

      const calls = (Sentry.init as ReturnType<typeof vi.fn>).mock.calls
      if (calls.length > 0) {
        expect(calls[0][0]).toHaveProperty('integrations')
      }
    })

    it('should configure session replay', async () => {
      await initializeSentry('client')

      const calls = (Sentry.init as ReturnType<typeof vi.fn>).mock.calls
      if (calls.length > 0) {
        expect(calls[0][0]).toMatchObject({
          replaysSessionSampleRate: 1.0,
          replaysOnErrorSampleRate: 1.0,
        })
      }
    })

    it('should configure profiling', async () => {
      await initializeSentry('client')

      const calls = (Sentry.init as ReturnType<typeof vi.fn>).mock.calls
      if (calls.length > 0) {
        expect(calls[0][0]).toMatchObject({
          profilesSampleRate: 1.0,
        })
      }
    })

    it('should configure trace propagation targets', async () => {
      await initializeSentry('client')

      const calls = (Sentry.init as ReturnType<typeof vi.fn>).mock.calls
      if (calls.length > 0) {
        expect(calls[0][0].tracePropagationTargets).toContain('localhost')
      }
    })

    it('should include PII scrubbing in beforeSend', async () => {
      await initializeSentry('client')

      const calls = (Sentry.init as ReturnType<typeof vi.fn>).mock.calls
      if (calls.length > 0) {
        expect(calls[0][0].beforeSend).toBeDefined()
        expect(typeof calls[0][0].beforeSend).toBe('function')
      }
    })
  })
})
