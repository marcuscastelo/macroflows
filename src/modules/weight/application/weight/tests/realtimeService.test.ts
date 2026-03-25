import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('createWeightRealtimeService', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('registers the realtime callback only once across service instances', async () => {
    const registerSubapabaseRealtimeCallback = vi.fn()

    vi.doMock('~/shared/supabase/supabase', () => ({
      registerSubapabaseRealtimeCallback,
    }))
    vi.doMock('~/shared/utils/logging', () => ({
      logging: {
        debug: vi.fn(),
      },
    }))

    const { createWeightRealtimeService } =
      await import('~/modules/weight/infrastructure/weight/supabase/realtime')

    const callbacks = {
      onInsert: vi.fn(),
      onUpdate: vi.fn(),
      onDelete: vi.fn(),
    }

    createWeightRealtimeService().initializeWeightRealtime(callbacks)
    createWeightRealtimeService().initializeWeightRealtime(callbacks)

    expect(registerSubapabaseRealtimeCallback).toHaveBeenCalledTimes(1)
  })
})
