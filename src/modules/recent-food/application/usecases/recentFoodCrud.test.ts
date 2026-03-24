import { describe, expect, it, vi } from 'vitest'

import { createRecentFoodCrud } from '~/modules/recent-food/application/usecases/recentFoodCrud'
import { type showPromise as toastShowPromise } from '~/modules/toast/application/toastManager'

describe('createRecentFoodCrud', () => {
  it('rejects deleteRecentFoodByReference when the repository returns false', async () => {
    let showPromiseCalls = 0
    const showPromise: typeof toastShowPromise = async <T>(
      promise: Promise<T>,
    ) => {
      showPromiseCalls += 1
      return await promise
    }
    const recentFoodCrud = createRecentFoodCrud({
      recentFoodRepository: {
        fetchByUserTypeAndReferenceId: vi.fn(),
        fetchUserRecentFoodsAsTemplates: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        deleteByReference: vi.fn().mockResolvedValue(false),
      },
      showPromise,
    })

    await expect(
      recentFoodCrud.deleteRecentFoodByReference('user-1', 'food', 42),
    ).rejects.toThrow('Failed to delete recent food record')

    expect(showPromiseCalls).toBe(1)
  })

  it('resolves deleteRecentFoodByReference when the repository returns true', async () => {
    let showPromiseCalls = 0
    const showPromise: typeof toastShowPromise = async <T>(
      promise: Promise<T>,
    ) => {
      showPromiseCalls += 1
      return await promise
    }
    const recentFoodCrud = createRecentFoodCrud({
      recentFoodRepository: {
        fetchByUserTypeAndReferenceId: vi.fn(),
        fetchUserRecentFoodsAsTemplates: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        deleteByReference: vi.fn().mockResolvedValue(true),
      },
      showPromise,
    })

    await expect(
      recentFoodCrud.deleteRecentFoodByReference('user-1', 'food', 42),
    ).resolves.toBe(true)

    expect(showPromiseCalls).toBe(1)
  })
})
