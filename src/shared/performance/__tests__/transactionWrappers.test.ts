/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { type NewRecipe } from '~/modules/diet/recipe/domain/recipe'
import { type UnifiedItem } from '~/modules/diet/unified-item/schema/unifiedItemSchema'
import {
  trackDayCreation,
  trackFoodSearch,
  trackMacroTargetUpdate,
  trackMealItemAddition,
  trackRecipeCreation,
  trackUserLogin,
  trackWeightEntry,
} from '~/shared/performance'

// Mock Sentry
vi.mock('~/shared/config/sentry', () => ({
  sentry: {
    isSentryEnabled: () => true,
    startSpan: vi.fn(() => ({
      setAttribute: vi.fn(),
      recordException: vi.fn(),
      setStatus: vi.fn(),
      end: vi.fn(),
    })),
    addBreadcrumb: vi.fn(),
  },
}))

describe('Transaction Wrappers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Diet Management Transactions', () => {
    it('should track day creation operations', async () => {
      const mockOperation = vi.fn().mockResolvedValue({ id: 'day123' })

      const result = await trackDayCreation(
        'user123',
        '2024-01-01',
        mockOperation,
      )

      expect((result as { id: string }).id).toBe('day123')
      expect(mockOperation).toHaveBeenCalledTimes(1)
    })

    it('should track meal item addition operations', async () => {
      const mockOperation = vi.fn().mockResolvedValue(undefined)
      const mockItem: UnifiedItem = {
        id: 123,
        name: 'Test Food',
        quantity: 100,
        reference: {
          type: 'food' as const,
          id: 456,
          macros: {
            protein: 10,
            carbs: 20,
            fat: 5,
            __type: 'MacroNutrients' as const,
          },
        },
        __type: 'UnifiedItem' as const,
      }

      await trackMealItemAddition('user123', 'meal123', mockItem, mockOperation)

      expect(mockOperation).toHaveBeenCalledTimes(1)
    })

    it('should handle operation failures in diet transactions', async () => {
      const mockError = new Error('Database error')
      const mockOperation = vi.fn().mockRejectedValue(mockError)

      await expect(
        trackDayCreation('user123', '2024-01-01', mockOperation),
      ).rejects.toThrow('Database error')

      expect(mockOperation).toHaveBeenCalledTimes(1)
    })
  })

  describe('Search Transactions', () => {
    it('should track food search operations', async () => {
      const mockResults = [
        { id: 'food1', name: 'Banana' },
        { id: 'food2', name: 'Apple' },
      ]
      const mockOperation = vi.fn().mockResolvedValue(mockResults)

      const result = await trackFoodSearch('banana', mockOperation, 'user123')

      expect(result).toEqual(mockResults)
      expect(mockOperation).toHaveBeenCalledTimes(1)
    })

    it('should track search operations without user ID', async () => {
      const mockOperation = vi.fn().mockResolvedValue([])

      const result = await trackFoodSearch('apple', mockOperation, undefined)

      expect(result).toEqual([])
      expect(mockOperation).toHaveBeenCalledTimes(1)
    })

    it('should handle search operation failures', async () => {
      const mockError = new Error('Search API timeout')
      const mockOperation = vi.fn().mockRejectedValue(mockError)

      await expect(
        trackFoodSearch('banana', mockOperation, 'user123'),
      ).rejects.toThrow('Search API timeout')

      expect(mockOperation).toHaveBeenCalledTimes(1)
    })
  })

  describe('Recipe Management Transactions', () => {
    it('should track recipe creation operations', async () => {
      const mockNewRecipe: NewRecipe = {
        name: 'Test Recipe',
        owner: 123,
        items: [],
        prepared_multiplier: 1,
        __type: 'NewRecipe' as const,
      }
      const mockOperation = vi.fn().mockResolvedValue({ id: 'recipe123' })

      const result = await trackRecipeCreation(
        mockNewRecipe,
        'user123',
        mockOperation,
      )

      expect((result as { id: string }).id).toBe('recipe123')
      expect(mockOperation).toHaveBeenCalledTimes(1)
    })

    it('should handle recipe creation failures', async () => {
      const mockNewRecipe = {
        name: 'Test Recipe',
        owner: 123,
        items: [],
        prepared_multiplier: 1,
        __type: 'NewRecipe' as const,
      }
      const mockError = new Error('Recipe validation failed')
      const mockOperation = vi.fn().mockRejectedValue(mockError)

      await expect(
        trackRecipeCreation(mockNewRecipe, 'user123', mockOperation),
      ).rejects.toThrow('Recipe validation failed')

      expect(mockOperation).toHaveBeenCalledTimes(1)
    })
  })

  describe('Weight Tracking Transactions', () => {
    it('should track weight entry operations', async () => {
      const mockWeightData = {
        weight: 75.5,
        target_timestamp: new Date('2024-01-01T10:00:00Z'),
      }
      const mockOperation = vi.fn().mockResolvedValue({ id: 'weight123' })

      const result = await trackWeightEntry(
        mockWeightData,
        'user123',
        mockOperation,
      )

      expect((result as { id: string }).id).toBe('weight123')
      expect(mockOperation).toHaveBeenCalledTimes(1)
    })

    it('should handle weight entry failures', async () => {
      const mockWeightData = {
        weight: 75.5,
        target_timestamp: new Date('2024-01-01T10:00:00Z'),
      }
      const mockError = new Error('Invalid weight value')
      const mockOperation = vi.fn().mockRejectedValue(mockError)

      await expect(
        trackWeightEntry(mockWeightData, 'user123', mockOperation),
      ).rejects.toThrow('Invalid weight value')

      expect(mockOperation).toHaveBeenCalledTimes(1)
    })
  })

  describe('Authentication Transactions', () => {
    it('should track user login operations', async () => {
      const mockOperation = vi.fn().mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' },
        session: { token: 'session123' },
      })

      const result = await trackUserLogin(
        'test@example.com',
        'email',
        mockOperation,
      )

      expect(
        (result as { user: { id: string }; session: { token: string } }).user
          .id,
      ).toBe('user123')
      expect(
        (result as { user: { id: string }; session: { token: string } }).session
          .token,
      ).toBe('session123')
      expect(mockOperation).toHaveBeenCalledTimes(1)
    })

    it('should handle login failures', async () => {
      const mockError = new Error('Invalid credentials')
      const mockOperation = vi.fn().mockRejectedValue(mockError)

      await expect(
        trackUserLogin('test@example.com', 'email', mockOperation),
      ).rejects.toThrow('Invalid credentials')

      expect(mockOperation).toHaveBeenCalledTimes(1)
    })
  })

  describe('Profile Management Transactions', () => {
    it('should track macro target updates', async () => {
      const mockTargets = {
        calories: 2000,
        protein: 150,
        carbs: 250,
        fat: 65,
      }
      const mockOperation = vi.fn().mockResolvedValue(undefined)

      await trackMacroTargetUpdate('user123', mockTargets, mockOperation)

      expect(mockOperation).toHaveBeenCalledTimes(1)
    })

    it('should handle partial macro target updates', async () => {
      const mockTargets = {
        calories: 2200,
        protein: 160,
      }
      const mockOperation = vi.fn().mockResolvedValue(undefined)

      await trackMacroTargetUpdate('user123', mockTargets, mockOperation)

      expect(mockOperation).toHaveBeenCalledTimes(1)
    })

    it('should handle macro target update failures', async () => {
      const mockTargets = {
        calories: -100, // Invalid negative calories
      }
      const mockError = new Error('Invalid macro targets')
      const mockOperation = vi.fn().mockRejectedValue(mockError)

      await expect(
        trackMacroTargetUpdate('user123', mockTargets, mockOperation),
      ).rejects.toThrow('Invalid macro targets')

      expect(mockOperation).toHaveBeenCalledTimes(1)
    })
  })

  describe('Transaction Context Handling', () => {
    it('should handle operations with rich context data', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success')

      const result = await trackFoodSearch(
        'complex search query with special chars!@#',
        mockOperation,
        'user123',
      )

      expect(result).toBe('success')
      expect(mockOperation).toHaveBeenCalledTimes(1)
    })

    it('should handle operations with minimal context', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success')

      const result = await trackFoodSearch('a', mockOperation, undefined)

      expect(result).toBe('success')
      expect(mockOperation).toHaveBeenCalledTimes(1)
    })
  })
})
