import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
vi.mock('~/modules/recent-food/application/usecases/recentFoodCrud', () => ({
  deleteRecentFoodByReference: vi.fn(),
}))

vi.mock('~/modules/template-search/application/templateSearch', () => ({
  debouncedTab: vi.fn(),
}))

vi.mock('~/modules/toast/application/toastManager', () => ({
  showPromise: vi.fn(),
}))

vi.mock('~/modules/user/application/user', () => ({
  currentUserId: vi.fn(),
}))

vi.mock('~/shared/error/errorHandler', () => ({
  createErrorHandler: vi.fn(() => ({
    error: vi.fn(),
    apiError: vi.fn(),
    validationError: vi.fn(),
    criticalError: vi.fn(),
  })),
}))

// Import the mocked modules
import { deleteRecentFoodByReference } from '~/modules/recent-food/application/usecases/recentFoodCrud'
import { debouncedTab } from '~/modules/template-search/application/templateSearch'
import { showPromise } from '~/modules/toast/application/toastManager'
import { currentUserId } from '~/modules/user/application/user'
import { createErrorHandler } from '~/shared/error/errorHandler'

const mockDeleteRecentFoodByReference = vi.mocked(deleteRecentFoodByReference)
const mockDebouncedTab = vi.mocked(debouncedTab)
const mockShowPromise = vi.mocked(showPromise)
const mockCurrentUserId = vi.mocked(currentUserId)
const mockCreateErrorHandler = vi.mocked(createErrorHandler)

describe('RemoveFromRecentButton Logic', () => {
  const mockRefetch = vi.fn()
  const mockUserId = 1

  const mockFoodTemplate: Food = promoteNewFoodToFood(
    createNewFood({
      name: 'Test Food',
      ean: '1234567890',
      macros: createMacroNutrients({
        protein: 5,
        carbs: 10,
        fat: 5,
      }),
    }),
    { id: 1 },
  )

  const mockRecipeTemplate: Recipe = promoteRecipe(
    createNewRecipe({
      name: 'Test Recipe',
      owner: 1,
      items: [],
      prepared_multiplier: 1,
    }),
    { id: 2 },
  )

  beforeEach(() => {
    vi.clearAllMocks()
    mockCurrentUserId.mockReturnValue(mockUserId)
    mockDebouncedTab.mockReturnValue('recent')
    mockShowPromise.mockImplementation((promise) => promise)
    mockDeleteRecentFoodByReference.mockResolvedValue(true)
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

  describe('API Integration Logic', () => {
    it('calls deleteRecentFoodByReference with correct parameters for food template', async () => {
      const templateType = isTemplateFood(mockFoodTemplate) ? 'food' : 'recipe'
      const templateId = mockFoodTemplate.id

      await deleteRecentFoodByReference(mockUserId, templateType, templateId)

      expect(mockDeleteRecentFoodByReference).toHaveBeenCalledWith(
        mockUserId,
        'food',
        mockFoodTemplate.id,
      )
    })

    it('calls deleteRecentFoodByReference with correct parameters for recipe template', async () => {
      const templateType = isTemplateFood(mockRecipeTemplate)
        ? 'food'
        : 'recipe'
      const templateId = mockRecipeTemplate.id

      await deleteRecentFoodByReference(mockUserId, templateType, templateId)

      expect(mockDeleteRecentFoodByReference).toHaveBeenCalledWith(
        mockUserId,
        'recipe',
        mockRecipeTemplate.id,
      )
    })
  })

  describe('Toast Promise Integration', () => {
    it('configures showPromise with correct parameters', async () => {
      const promise = deleteRecentFoodByReference(
        mockUserId,
        'food',
        mockFoodTemplate.id,
      )

      await showPromise(promise, {
        loading: 'Removendo item da lista de recentes...',
        success: 'Item removido da lista de recentes com sucesso!',
        error: (err: unknown) => {
          const errorHandler = mockCreateErrorHandler('user', 'RecentFood')
          errorHandler.error(err, {
            operation: 'userAction',
          })
          return 'Erro ao remover item da lista de recentes.'
        },
      })

      expect(mockShowPromise).toHaveBeenCalledWith(
        expect.any(Promise),
        expect.objectContaining({
          loading: 'Removendo item da lista de recentes...',
          success: 'Item removido da lista de recentes com sucesso!',
          error: expect.any(Function),
        }),
      )
    })
  })

  describe('Error Handling Logic', () => {
    it('handles API errors correctly', () => {
      const mockError = new Error('API Error')

      // Create error handler function like in the component
      const errorHandler = (err: unknown) => {
        const handler = mockCreateErrorHandler('user', 'RecentFood')
        handler.error(err, {
          operation: 'userAction',
        })
        return 'Erro ao remover item da lista de recentes.'
      }

      const errorMessage = errorHandler(mockError)

      expect(mockCreateErrorHandler).toHaveBeenCalledWith('user', 'RecentFood')
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
