import { beforeEach, describe, expect, it, vi } from 'vitest'

async function loadSentryModule() {
  const init = vi.fn()

  vi.doMock('@sentry/solidstart', () => ({
    init,
    getClient: vi.fn(() => ({ id: 'client' })),
    browserTracingIntegration: vi.fn(() => ({ name: 'browserTracing' })),
    browserProfilingIntegration: vi.fn(() => ({ name: 'browserProfiling' })),
    replayIntegration: vi.fn(() => ({ name: 'replay' })),
    consoleLoggingIntegration: vi.fn(() => ({ name: 'consoleLogging' })),
  }))

  const module =
    await import('~/modules/observability/infrastructure/sentry/sentry')

  return {
    module,
    init,
  }
}

describe('createSentryService', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  it('shares the same in-flight initialization across concurrent calls', async () => {
    const { module, init } = await loadSentryModule()

    const service = module.createSentryService({
      createSentryConfig: () => ({
        dsn: 'https://public@example.ingest.sentry.io/1',
        release: 'macroflows@test',
        useOTel: false,
      }),
      createClientIntegrations: async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
        return []
      },
    })

    const firstInitialization = service.initializeSentry('client')
    const secondInitialization = service.initializeSentry('client')

    expect(init).not.toHaveBeenCalled()

    await Promise.all([firstInitialization, secondInitialization])

    expect(init).toHaveBeenCalledTimes(1)
  })

  it('keeps initialization idempotent across multiple service instances', async () => {
    const { module, init } = await loadSentryModule()

    const createSentryConfig = () => ({
      dsn: 'https://public@example.ingest.sentry.io/1',
      release: 'macroflows@test',
      useOTel: false,
    })

    await module
      .createSentryService({
        createSentryConfig,
        createClientIntegrations: async () => [],
      })
      .initializeSentry('client')

    await module
      .createSentryService({
        createSentryConfig,
        createClientIntegrations: async () => [],
      })
      .initializeSentry('client')

    expect(init).toHaveBeenCalledTimes(1)
  })
})
