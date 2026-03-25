import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('createDayDietRealtimeService', () => {
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

    const { createDayDietRealtimeService } =
      await import('~/modules/diet/day-diet/infrastructure/supabase/realtime')

    const callbacks = {
      onInsert: vi.fn(),
      onUpdate: vi.fn(),
      onDelete: vi.fn(),
    }

    createDayDietRealtimeService().initializeDayDietRealtime(callbacks)
    createDayDietRealtimeService().initializeDayDietRealtime(callbacks)

    expect(registerSubapabaseRealtimeCallback).toHaveBeenCalledTimes(1)
  })
})
