import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('createMacroProfileRealtimeService', () => {
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

    const { createMacroProfileRealtimeService } =
      await import('~/modules/diet/macro-profile/infrastructure/supabase/realtime')

    const callbacks = {
      onInsert: vi.fn(),
      onUpdate: vi.fn(),
      onDelete: vi.fn(),
    }

    createMacroProfileRealtimeService().initializeMacroProfileRealtime(
      callbacks,
    )
    createMacroProfileRealtimeService().initializeMacroProfileRealtime(
      callbacks,
    )

    expect(registerSubapabaseRealtimeCallback).toHaveBeenCalledTimes(1)
  })
})
