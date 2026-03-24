import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createTouchRecentFood } from '~/modules/diet/recent-food/application/usecases/touchRecentFood'
import { type RecentFoodReference } from '~/modules/diet/recent-food/application/usecases/extractRecentFoodReference'
import {
  createNewRecentFood,
  type NewRecentFood,
  promoteRecentFood,
  type RecentFood,
} from '~/modules/diet/recent-food/domain/recentFood'

const {
  mockCurrentUserIdOrGuestId,
  mockFetchRecentFoodByUserTypeAndReferenceId,
  mockInsertRecentFood,
  mockUpdateRecentFood,
} = vi.hoisted(() => ({
  mockCurrentUserIdOrGuestId: vi.fn<() => string>(),
  mockFetchRecentFoodByUserTypeAndReferenceId:
    vi.fn<
      (
        userId: string,
        type: RecentFood['type'],
        referenceId: number,
      ) => Promise<RecentFood | null>
    >(),
  mockInsertRecentFood:
    vi.fn<(input: NewRecentFood) => Promise<RecentFood | null>>(),
  mockUpdateRecentFood:
    vi.fn<(id: number, input: NewRecentFood) => Promise<RecentFood | null>>(),
}))

function createReference(
  overrides: Partial<RecentFoodReference> = {},
): RecentFoodReference {
  return {
    type: 'food',
    referenceId: 42,
    ...overrides,
  }
}

function createStoredRecentFood(
  overrides: Partial<Parameters<typeof createNewRecentFood>[0]> & {
    id?: number
  } = {},
) {
  return promoteRecentFood(
    createNewRecentFood({
      user_id: 'user-1',
      type: 'food',
      reference_id: 42,
      last_used: new Date('2026-01-01T00:00:00.000Z'),
      times_used: 1,
      ...overrides,
    }),
    { id: overrides.id ?? 1 },
  )
}

describe('touchRecentFood', () => {
  const touchRecentFood = createTouchRecentFood({
    getCurrentUserIdOrGuestId: mockCurrentUserIdOrGuestId,
    recentFoodCrud: {
      fetchRecentFoodByUserTypeAndReferenceId:
        mockFetchRecentFoodByUserTypeAndReferenceId,
      insertRecentFood: mockInsertRecentFood,
      updateRecentFood: mockUpdateRecentFood,
    },
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockCurrentUserIdOrGuestId.mockReturnValue('user-1')
  })

  it('inserts a new recent food when no record exists', async () => {
    const recentFoodRef = createReference()

    mockFetchRecentFoodByUserTypeAndReferenceId.mockResolvedValue(null)
    mockInsertRecentFood.mockResolvedValue(createStoredRecentFood())

    await touchRecentFood(recentFoodRef)

    expect(mockFetchRecentFoodByUserTypeAndReferenceId).toHaveBeenCalledWith(
      'user-1',
      'food',
      42,
    )
    expect(mockInsertRecentFood).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        type: 'food',
        reference_id: 42,
        times_used: 1,
      }),
    )
    expect(mockUpdateRecentFood).not.toHaveBeenCalled()
  })

  it('updates an existing recent food and increments times_used', async () => {
    const currentRecentFood = createStoredRecentFood({
      id: 9,
      times_used: 3,
    })

    mockFetchRecentFoodByUserTypeAndReferenceId.mockResolvedValue(
      currentRecentFood,
    )
    mockUpdateRecentFood.mockResolvedValue(
      createStoredRecentFood({ id: 9, times_used: 4 }),
    )

    await touchRecentFood(createReference())

    expect(mockUpdateRecentFood).toHaveBeenCalledWith(
      9,
      expect.objectContaining({
        user_id: 'user-1',
        type: 'food',
        reference_id: 42,
        times_used: 4,
      }),
    )
    expect(mockInsertRecentFood).not.toHaveBeenCalled()
  })

  it('throws when the fetched record belongs to a different user', async () => {
    mockFetchRecentFoodByUserTypeAndReferenceId.mockResolvedValue(
      createStoredRecentFood({ user_id: 'other-user' }),
    )

    await expect(touchRecentFood(createReference())).rejects.toThrow(
      'BUG: recentFood fetched does not match current user',
    )

    expect(mockUpdateRecentFood).not.toHaveBeenCalled()
  })

  it('throws when the fetched record does not match type/reference', async () => {
    mockFetchRecentFoodByUserTypeAndReferenceId.mockResolvedValue(
      createStoredRecentFood({ reference_id: 999 }),
    )

    await expect(touchRecentFood(createReference())).rejects.toThrow(
      'BUG: recentFood fetched does not match type/reference',
    )

    expect(mockUpdateRecentFood).not.toHaveBeenCalled()
  })

  it('throws when inserting a new recent food fails', async () => {
    mockFetchRecentFoodByUserTypeAndReferenceId.mockResolvedValue(null)
    mockInsertRecentFood.mockResolvedValue(null)

    await expect(touchRecentFood(createReference())).rejects.toThrow(
      'Failed to insert recent food record',
    )
  })

  it('throws when updating an existing recent food fails', async () => {
    mockFetchRecentFoodByUserTypeAndReferenceId.mockResolvedValue(
      createStoredRecentFood({ id: 12, times_used: 2 }),
    )
    mockUpdateRecentFood.mockResolvedValue(null)

    await expect(touchRecentFood(createReference())).rejects.toThrow(
      'Failed to update recent food record',
    )
  })
})
