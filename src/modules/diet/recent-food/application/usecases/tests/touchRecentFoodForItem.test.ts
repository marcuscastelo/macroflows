import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createFoodItem,
  type Item,
} from '~/modules/diet/item/schema/itemSchema'
import { createMacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { type RecentFoodReference } from '~/modules/diet/recent-food/application/usecases/extractRecentFoodReference'

const {
  mockExtractRecentFoodReferenceFromItem,
  mockTouchRecentFood,
  mockLoggingWarn,
} = vi.hoisted(() => ({
  mockExtractRecentFoodReferenceFromItem:
    vi.fn<(item: Item) => RecentFoodReference[]>(),
  mockTouchRecentFood:
    vi.fn<(recentFoodReference: RecentFoodReference) => Promise<void>>(),
  mockLoggingWarn: vi.fn<(message: string, meta?: unknown) => void>(),
}))

vi.mock(
  '~/modules/diet/recent-food/application/usecases/extractRecentFoodReference',
  () => ({
    extractRecentFoodReferenceFromItem: mockExtractRecentFoodReferenceFromItem,
  }),
)

vi.mock(
  '~/modules/diet/recent-food/application/usecases/touchRecentFood',
  () => ({
    touchRecentFood: mockTouchRecentFood,
  }),
)

vi.mock('~/shared/utils/logging', () => ({
  logging: {
    warn: mockLoggingWarn,
  },
}))

import { touchRecentFoodForItem } from '~/modules/diet/recent-food/application/usecases/touchRecentFoodForItem'

function createReference(
  overrides: Partial<RecentFoodReference> = {},
): RecentFoodReference {
  return {
    type: 'food',
    referenceId: 42,
    ...overrides,
  }
}

describe('touchRecentFoodForItem', () => {
  const item = createFoodItem({
    id: 1,
    name: 'Test item',
    quantity: 100,
    reference: {
      type: 'food',
      id: 42,
      macros: createMacroNutrients({
        carbsInGrams: 10,
        proteinInGrams: 5,
        fatInGrams: 2,
      }),
    },
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('logs a warning and exits when the item has no trackable references', async () => {
    mockExtractRecentFoodReferenceFromItem.mockReturnValue([])

    await expect(touchRecentFoodForItem(item)).resolves.toBeUndefined()

    expect(mockLoggingWarn).toHaveBeenCalledWith(
      'Cannot touch recent food for item - no trackable reference found',
      { item },
    )
    expect(mockTouchRecentFood).not.toHaveBeenCalled()
  })

  it('touches each extracted recent food reference in order', async () => {
    const references = [
      createReference(),
      createReference({ type: 'recipe', referenceId: 99 }),
    ]

    mockExtractRecentFoodReferenceFromItem.mockReturnValue(references)
    mockTouchRecentFood.mockResolvedValue(undefined)

    await touchRecentFoodForItem(item)

    expect(mockTouchRecentFood).toHaveBeenNthCalledWith(1, references[0])
    expect(mockTouchRecentFood).toHaveBeenNthCalledWith(2, references[1])
  })

  it('propagates failures from touchRecentFood after prior successful touches', async () => {
    const references = [
      createReference(),
      createReference({ referenceId: 100 }),
      createReference({ type: 'recipe', referenceId: 200 }),
    ]
    const failure = new Error('touch failed')

    mockExtractRecentFoodReferenceFromItem.mockReturnValue(references)
    mockTouchRecentFood
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(failure)

    await expect(touchRecentFoodForItem(item)).rejects.toThrow('touch failed')

    expect(mockTouchRecentFood).toHaveBeenCalledTimes(2)
    expect(mockTouchRecentFood).toHaveBeenNthCalledWith(1, references[0])
    expect(mockTouchRecentFood).toHaveBeenNthCalledWith(2, references[1])
  })
})
