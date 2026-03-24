import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('createSupabaseCachedSearchGateway', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('allows markSearchAsCached to be called after destructuring', async () => {
    const limit = vi.fn(async () => ({
      data: [],
      error: null,
    }))
    const eq = vi.fn(() => ({
      limit,
    }))
    const selectSearch = vi.fn(() => ({
      eq,
    }))
    const selectAfterUpsert = vi.fn(async () => ({
      error: null,
    }))
    const upsert = vi.fn(() => ({
      select: selectAfterUpsert,
    }))
    const from = vi.fn(() => ({
      select: selectSearch,
      upsert,
    }))

    vi.doMock('~/shared/supabase/supabase', () => ({
      supabase: {
        from,
      },
    }))
    vi.doMock('~/shared/utils/logging', () => ({
      logging: {
        error: vi.fn(),
      },
    }))

    const { createSupabaseCachedSearchGateway } =
      await import('~/modules/search/infrastructure/supabase/supabaseCachedSearchGateway')

    const gateway = createSupabaseCachedSearchGateway()

    await expect(
      gateway.markSearchAsCached.call(undefined, '  Search Term  '),
    ).resolves.toBeUndefined()

    expect(eq).toHaveBeenCalledWith('search', 'search term')
    expect(upsert).toHaveBeenCalledWith({
      search: 'search term',
    })
    expect(selectAfterUpsert).toHaveBeenCalledTimes(1)
  })
})
