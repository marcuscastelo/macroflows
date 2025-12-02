/**
 * Recipe Item Use Cases Tests
 *
 * Tests for the error handling pattern in recipeItemUseCases.
 */

import { describe, expect, it, vi } from 'vitest'

// Mock logging with spies before any imports
vi.mock('~/shared/utils/logging', () => ({
  logging: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock showError to avoid dependencies on env/toast internals
vi.mock('~/modules/toast/application/toastManager', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
  showLoading: vi.fn(),
  showInfo: vi.fn(),
  show: vi.fn(),
}))

// Import the module under test
import { recipeItemUseCases } from '~/modules/diet/item/application/recipeItemUseCases'
import { type RecipeItem } from '~/modules/diet/item/schema/itemSchema'
import {
  createNewRecipe,
  promoteRecipe,
} from '~/modules/diet/recipe/domain/recipe'
import { showError } from '~/modules/toast/application/toastManager'
// Import the mocked modules to spy on them
import { logging } from '~/shared/utils/logging'

describe('recipeItemUseCases', () => {
  describe('withEditedQuantity', () => {
    it('should call logging.error before showError when an error occurs', () => {
      // Reset mocks before test
      vi.clearAllMocks()

      const recipe = promoteRecipe(
        createNewRecipe({
          name: 'Test Recipe',
          items: [],
          user_id: 'test-user',
          prepared_multiplier: 1,
        }),
        { id: 1 },
      )

      // Create a recipe item that will cause an error when scaling
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const invalidItem = {
        id: 1,
        name: 'Test Item',
        quantity: 0, // This will cause a division by zero issue
        reference: {
          type: 'recipe',
          id: recipe.id,
        },
        children: [
          {
            id: 2,
            name: 'Child Item',
            quantity: 100,
            reference: { type: 'food', id: 1 },
          },
        ],
      } as unknown as RecipeItem

      // Call the function that should trigger error handling
      const result = recipeItemUseCases.withEditedQuantity(
        invalidItem,
        recipe,
        100,
      )

      // The result should be a copy of the original item (error fallback)
      expect(result).toEqual({ ...invalidItem })

      // Verify that logging.error was called before showError
      // by checking both were called
      expect(logging.error).toHaveBeenCalled()
      expect(showError).toHaveBeenCalled()

      // Verify the logging call has the correct message pattern
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const loggingMock = logging.error as ReturnType<typeof vi.fn>
      const loggingCall = loggingMock.mock.calls[0]
      expect(loggingCall?.[0]).toContain('recipeItemUseCases')
      expect(loggingCall?.[0]).toContain('Error scaling recipe item')
    })

    it('should include structured context in logging error', () => {
      // Reset mocks before test
      vi.clearAllMocks()

      const recipe = promoteRecipe(
        createNewRecipe({
          name: 'Test Recipe',
          items: [],
          user_id: 'test-user',
          prepared_multiplier: 1,
        }),
        { id: 1 },
      )

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const invalidItem = {
        id: 42,
        name: 'Test Item',
        quantity: 0,
        reference: {
          type: 'recipe',
          id: 999,
        },
        children: [],
      } as unknown as RecipeItem

      recipeItemUseCases.withEditedQuantity(invalidItem, recipe, 100)

      // Verify the structured context includes itemId and recipeId
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const loggingMock = logging.error as ReturnType<typeof vi.fn>
      const loggingCall = loggingMock.mock.calls[0]
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const contextArg = loggingCall?.[2]
      expect(contextArg).toBeDefined()
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(contextArg?.component).toBe('recipeItemUseCases')
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(contextArg?.itemId).toBe(42)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(contextArg?.recipeId).toBe(1)
    })
  })
})
