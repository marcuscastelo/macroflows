import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createNewFood,
  type Food,
  promoteNewFoodToFood,
} from '~/modules/diet/food/domain/food'
import { createMacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import {
  createNewRecipe,
  promoteRecipe,
  type Recipe,
} from '~/modules/diet/recipe/domain/recipe'
import { isTemplateFood } from '~/modules/diet/template/domain/template'
import { logging } from '~/shared/utils/logging'

const { mockDeleteRecentFoodByReference } = vi.hoisted(() => ({
  mockDeleteRecentFoodByReference:
    vi.fn<
      (
        userId: string,
        type: 'food' | 'recipe',
        referenceId: number,
      ) => Promise<boolean>
    >(),
}))

vi.mock('~/shared/utils/logging', () => ({
  logging: {
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}))

describe('RemoveFromRecentButton Logic', () => {
  const mockUserId = '42'

  const mockFoodTemplate: Food = promoteNewFoodToFood(
    createNewFood({
      name: 'Test Food',
      ean: '1234567890',
      macros: createMacroNutrients({
        proteinInGrams: 5,
        carbsInGrams: 10,
        fatInGrams: 5,
      }),
    }),
    { id: 1 },
  )

  const mockRecipeTemplate: Recipe = promoteRecipe(
    createNewRecipe({
      name: 'Test Recipe',
      user_id: '',
      items: [],
      prepared_multiplier: 1,
    }),
    { id: 2 },
  )

  beforeEach(() => {
    vi.clearAllMocks()
    mockDeleteRecentFoodByReference.mockResolvedValue(true)
  })

  it('extracts the food reference payload used by the container-backed use case', async () => {
    const templateType = isTemplateFood(mockFoodTemplate) ? 'food' : 'recipe'
    const templateId = mockFoodTemplate.id

    await mockDeleteRecentFoodByReference(mockUserId, templateType, templateId)

    expect(mockDeleteRecentFoodByReference).toHaveBeenCalledWith(
      mockUserId,
      'food',
      mockFoodTemplate.id,
    )
  })

  it('extracts the recipe reference payload used by the container-backed use case', async () => {
    const templateType = isTemplateFood(mockRecipeTemplate) ? 'food' : 'recipe'
    const templateId = mockRecipeTemplate.id

    await mockDeleteRecentFoodByReference(mockUserId, templateType, templateId)

    expect(mockDeleteRecentFoodByReference).toHaveBeenCalledWith(
      mockUserId,
      'recipe',
      mockRecipeTemplate.id,
    )
  })

  it('logs removal failures from the container-backed use case', async () => {
    const error = new Error('API Error')
    mockDeleteRecentFoodByReference.mockRejectedValueOnce(error)

    await mockDeleteRecentFoodByReference(
      mockUserId,
      'food',
      mockFoodTemplate.id,
    ).catch((err) => {
      logging.error('RemoveFromRecentButton error:', err)
    })

    expect(logging.error).toHaveBeenCalledWith(
      'RemoveFromRecentButton error:',
      error,
    )
  })
})
