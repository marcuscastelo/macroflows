import { describe, expect, it } from 'vitest'

import { createItem, type Item } from '~/modules/diet/item/schema/itemSchema'
import { createMacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import {
  createNewRecipe,
  promoteRecipe,
  type Recipe,
} from '~/modules/diet/recipe/domain/recipe'
import {
  createScaledRecipe,
  getRecipePreparedQuantity,
  getRecipeRawQuantity,
  scaleRecipeByPreparedQuantity,
} from '~/modules/diet/recipe/domain/recipeOperations'

function makeItem(id: number, name = 'Arroz'): Item {
  return createItem({
    id,
    name,
    quantity: 100,
    reference: {
      type: 'food' as const,
      id,
      macros: createMacroNutrients({ carbs: 10, protein: 2, fat: 1 }),
    },
  })
}

describe('Recipe scaling operations', () => {
  const makeRecipe = (items: Item[], prepared_multiplier = 1): Recipe => {
    return promoteRecipe(
      createNewRecipe({
        name: 'Test Recipe',
        user_id: '',
        items,
        prepared_multiplier,
      }),
      { id: 1 },
    )
  }

  describe('getRecipeRawQuantity', () => {
    it('calculates total raw quantity correctly', () => {
      const items = [makeItem(1, 'A'), makeItem(2, 'B')] // 100g + 100g = 200g
      const recipe = makeRecipe(items)
      expect(getRecipeRawQuantity(recipe)).toBe(200)
    })

    it('returns 0 for empty recipe', () => {
      const recipe = makeRecipe([])
      expect(getRecipeRawQuantity(recipe)).toBe(0)
    })
  })

  describe('getRecipePreparedQuantity', () => {
    it('calculates prepared quantity with multiplier 1', () => {
      const items = [makeItem(1, 'A'), makeItem(2, 'B')] // 200g raw
      const recipe = makeRecipe(items, 1)
      expect(getRecipePreparedQuantity(recipe)).toBe(200) // 200g * 1 = 200g
    })

    it('calculates prepared quantity with multiplier < 1', () => {
      const items = [makeItem(1, 'A'), makeItem(2, 'B')] // 200g raw
      const recipe = makeRecipe(items, 0.8)
      expect(getRecipePreparedQuantity(recipe)).toBe(160) // 200g * 0.8 = 160g
    })

    it('calculates prepared quantity with multiplier > 1', () => {
      const items = [makeItem(1, 'A')] // 100g raw
      const recipe = makeRecipe(items, 1.5)
      expect(getRecipePreparedQuantity(recipe)).toBe(150) // 100g * 1.5 = 150g
    })
  })

  describe('scaleRecipeByPreparedQuantity', () => {
    it('scales recipe items correctly', () => {
      const items = [
        { ...makeItem(1, 'A'), quantity: 100 }, // 100g
        { ...makeItem(2, 'B'), quantity: 200 }, // 200g
      ] // Total: 300g raw, 240g prepared (300 * 0.8)
      const recipe = makeRecipe(items, 0.8)

      const result = scaleRecipeByPreparedQuantity(recipe, 120) // Want half

      expect(result.scalingFactor).toBe(0.5) // 120 / 240 = 0.5
      expect(result.scaledItems).toHaveLength(2)
      expect(result.scaledItems[0]?.quantity).toBe(50) // 100 * 0.5
      expect(result.scaledItems[1]?.quantity).toBe(100) // 200 * 0.5
    })

    it('handles scaling factor 1 (same quantity)', () => {
      const items = [{ ...makeItem(1, 'A'), quantity: 100 }]
      const recipe = makeRecipe(items, 0.8) // 100g raw, 80g prepared

      const result = scaleRecipeByPreparedQuantity(recipe, 80)

      expect(result.scalingFactor).toBe(1)
      expect(result.scaledItems[0]?.quantity).toBe(100)
    })

    it('handles zero desired quantity', () => {
      const items = [{ ...makeItem(1, 'A'), quantity: 100 }]
      const recipe = makeRecipe(items, 0.8)

      const result = scaleRecipeByPreparedQuantity(recipe, 0)

      expect(result.scalingFactor).toBe(0)
      expect(result.scaledItems[0]?.quantity).toBe(0)
    })

    it('throws error for negative desired quantity', () => {
      const items = [{ ...makeItem(1, 'A'), quantity: 100 }]
      const recipe = makeRecipe(items, 0.8)

      expect(() => scaleRecipeByPreparedQuantity(recipe, -10)).toThrow(
        'Desired prepared quantity must be non-negative',
      )
    })

    it('throws error for zero prepared quantity', () => {
      const items = [{ ...makeItem(1, 'A'), quantity: 0 }]
      const recipe = makeRecipe(items, 0.8) // 0 * 0.8 = 0

      expect(() => scaleRecipeByPreparedQuantity(recipe, 100)).toThrow(
        'Recipe prepared quantity must be greater than 0',
      )
    })
  })

  describe('createScaledRecipe', () => {
    it('creates scaled recipe with correct properties', () => {
      const items = [
        { ...makeItem(1, 'A'), quantity: 100 },
        { ...makeItem(2, 'B'), quantity: 200 },
      ]
      const recipe = makeRecipe(items, 0.8)

      const scaledRecipe = createScaledRecipe(recipe, 120) // Half of 240g prepared

      expect(scaledRecipe.name).toBe('Test Recipe')
      expect(scaledRecipe.prepared_multiplier).toBe(0.8) // Multiplier stays same
      expect(scaledRecipe.items).toHaveLength(2)
      expect(scaledRecipe.items[0]?.quantity).toBe(50)
      expect(scaledRecipe.items[1]?.quantity).toBe(100)
    })
  })
})
