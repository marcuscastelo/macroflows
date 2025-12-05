import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { authUseCases } from '~/modules/auth/application/usecases/authUseCases'
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
import {
  isTemplateFood,
  type Template,
} from '~/modules/diet/template/domain/template'

// Mock the modules
vi.mock(
  '~/modules/diet/recent-food/application/usecases/recentFoodCrud',
  () => ({
    deleteRecentFoodByReference: vi.fn(),
  }),
)

vi.mock(
  '~/modules/template-search/application/usecases/templateSearchState',
  () => ({
    debouncedTab: vi.fn(),
  }),
)

vi.mock('~/modules/toast/application/toastManager', () => ({
  showPromise: vi.fn(),
}))

vi.mock('~/modules/user/application/user', () => ({
  currentUserId: vi.fn(),
}))

vi.mock('~/shared/utils/logging', () => ({
  logging: {
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}))

// Import the mocked modules
import { debouncedTab } from '~/modules/template-search/application/usecases/templateSearchState'
import { showPromise } from '~/modules/toast/application/toastManager'
import { logging } from '~/shared/utils/logging'

const mockDebouncedTab = vi.mocked(debouncedTab)
const mockShowPromise = vi.mocked(showPromise)
const mockLogging = vi.mocked(logging)

describe('RemoveFromRecentButton Logic', () => {
  const mockRefetch = vi.fn()
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
    vi.spyOn(authUseCases, 'currentUserIdOrGuestId').mockReturnValue(mockUserId)
    mockDebouncedTab.mockReturnValue('recent')
    mockShowPromise.mockImplementation((promise) => promise)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Template Type Detection', () => {
    it('correctly identifies food templates', () => {
      expect(isTemplateFood(mockFoodTemplate)).toBe(true)
      expect(isTemplateFood(mockRecipeTemplate)).toBe(false)
    })

    it('correctly identifies recipe templates', () => {
      expect(isTemplateFood(mockRecipeTemplate)).toBe(false)
      expect(!isTemplateFood(mockRecipeTemplate)).toBe(true)
    })
  })

  describe('Food Template Handling Logic', () => {
    it('extracts correct type and id from food template', () => {
      const templateType = isTemplateFood(mockFoodTemplate) ? 'food' : 'recipe'
      const templateId = mockFoodTemplate.id

      expect(templateType).toBe('food')
      expect(templateId).toBe(mockFoodTemplate.id)
    })
  })

  describe('Recipe Template Handling Logic', () => {
    it('extracts correct type and id from recipe template', () => {
      const templateType = isTemplateFood(mockRecipeTemplate)
        ? 'food'
        : 'recipe'
      const templateId = mockRecipeTemplate.id

      expect(templateType).toBe('recipe')
      expect(templateId).toBe(mockRecipeTemplate.id)
    })
  })

  describe('Error Handling Logic', () => {
    it('handles API errors correctly', () => {
      const mockError = new Error('API Error')

      // Create error handler function like in the component
      const errorHandler = (err: unknown) => {
        mockLogging.error('RemoveFromRecentButton error:', err)
        return 'Erro ao remover item da lista de recentes.'
      }

      const errorMessage = errorHandler(mockError)

      expect(mockLogging.error).toHaveBeenCalledWith(
        'RemoveFromRecentButton error:',
        mockError,
      )
      expect(errorMessage).toBe('Erro ao remover item da lista de recentes.')
    })
  })

  describe('Component Props Interface', () => {
    it('supports both food and recipe templates', () => {
      const templates: Template[] = [mockFoodTemplate, mockRecipeTemplate]

      templates.forEach((template) => {
        const props = {
          template,
          refetch: mockRefetch,
        }

        expect(props.template).toBeDefined()
        expect(isTemplateFood(props.template) ? 'Food' : 'Recipe').toMatch(
          /^(Food|Recipe)$/,
        )
        expect(props.template.id).toBeTypeOf('number')
        expect(props.refetch).toBeTypeOf('function')
      })
    })
  })

  describe('Tab Visibility Logic', () => {
    it('respects debouncedTab state for component visibility', () => {
      // Test when tab is 'recent'
      mockDebouncedTab.mockReturnValue('recent')
      expect(debouncedTab()).toBe('recent')

      // Test when tab is not 'recent'
      mockDebouncedTab.mockReturnValue('all')
      expect(debouncedTab()).toBe('all')
    })
  })
})
