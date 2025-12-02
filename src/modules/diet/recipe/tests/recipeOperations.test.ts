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
  getSingleItemConversionDescription,
  isSingleItemRecipe,
  isValidPreparedMultiplier,
  scaleRecipeByPreparedQuantity,
  updateRecipePreparedMultiplier,
} from '~/modules/diet/recipe/domain/recipeOperations'

function makeItem(id: number, name = 'Arroz'): Item {
  return createItem({
    id,
    name,
    quantity: 100,
    reference: {
      type: 'food' as const,
      id,
      macros: createMacroNutrients({ carbsInGrams: 10, proteinInGrams: 2, fatInGrams: 1 }),
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

  describe('Single-item recipe operations', () => {
    describe('isSingleItemRecipe', () => {
      it('returns true for recipe with exactly one item', () => {
        const items = [makeItem(1, 'Macarrão cru')]
        const recipe = makeRecipe(items, 2.22)

        expect(isSingleItemRecipe(recipe)).toBe(true)
      })

      it('returns false for recipe with multiple items', () => {
        const items = [makeItem(1, 'A'), makeItem(2, 'B')]
        const recipe = makeRecipe(items)

        expect(isSingleItemRecipe(recipe)).toBe(false)
      })

      it('returns false for empty recipe', () => {
        const recipe = makeRecipe([])

        expect(isSingleItemRecipe(recipe)).toBe(false)
      })
    })

    describe('isValidPreparedMultiplier', () => {
      it('returns true for positive multipliers', () => {
        expect(isValidPreparedMultiplier(1)).toBe(true)
        expect(isValidPreparedMultiplier(0.5)).toBe(true)
        expect(isValidPreparedMultiplier(2.22)).toBe(true)
        expect(isValidPreparedMultiplier(100)).toBe(true)
        expect(isValidPreparedMultiplier(0.001)).toBe(true)
      })

      it('returns false for zero', () => {
        expect(isValidPreparedMultiplier(0)).toBe(false)
      })

      it('returns false for negative numbers', () => {
        expect(isValidPreparedMultiplier(-1)).toBe(false)
        expect(isValidPreparedMultiplier(-0.5)).toBe(false)
      })

      it('returns false for non-finite numbers', () => {
        expect(isValidPreparedMultiplier(Infinity)).toBe(false)
        expect(isValidPreparedMultiplier(-Infinity)).toBe(false)
        expect(isValidPreparedMultiplier(NaN)).toBe(false)
      })
    })

    describe('updateRecipePreparedMultiplier', () => {
      it('updates multiplier with valid positive value', () => {
        const recipe = makeRecipe([makeItem(1, 'A')], 1)

        const updated = updateRecipePreparedMultiplier(recipe, 2.22)

        expect(updated.prepared_multiplier).toBe(2.22)
      })

      it('throws error for zero multiplier', () => {
        const recipe = makeRecipe([makeItem(1, 'A')], 1)

        expect(() => updateRecipePreparedMultiplier(recipe, 0)).toThrow(
          'Prepared multiplier must be a positive number',
        )
      })

      it('throws error for negative multiplier', () => {
        const recipe = makeRecipe([makeItem(1, 'A')], 1)

        expect(() => updateRecipePreparedMultiplier(recipe, -1)).toThrow(
          'Prepared multiplier must be a positive number',
        )
      })

      it('throws error for Infinity', () => {
        const recipe = makeRecipe([makeItem(1, 'A')], 1)

        expect(() => updateRecipePreparedMultiplier(recipe, Infinity)).toThrow(
          'Prepared multiplier must be a positive number',
        )
      })

      it('throws error for NaN', () => {
        const recipe = makeRecipe([makeItem(1, 'A')], 1)

        expect(() => updateRecipePreparedMultiplier(recipe, NaN)).toThrow(
          'Prepared multiplier must be a positive number',
        )
      })
    })

    describe('getSingleItemConversionDescription', () => {
      it('returns conversion description for single-item recipe', () => {
        const items = [makeItem(1, 'Macarrão cru')]
        const recipe = {
          ...makeRecipe(items, 2.22),
          name: 'Macarrão cozido',
        }

        const description = getSingleItemConversionDescription(recipe)

        expect(description).toBe('1g Macarrão cozido = 2,22g Macarrão cru')
      })

      it('returns null for multi-item recipe', () => {
        const items = [makeItem(1, 'A'), makeItem(2, 'B')]
        const recipe = makeRecipe(items)

        expect(getSingleItemConversionDescription(recipe)).toBeNull()
      })

      it('returns null for empty recipe', () => {
        const recipe = makeRecipe([])

        expect(getSingleItemConversionDescription(recipe)).toBeNull()
      })

      it('handles multiplier of 1 correctly', () => {
        const items = [makeItem(1, 'Ingredient')]
        const recipe = {
          ...makeRecipe(items, 1),
          name: 'Recipe',
        }

        const description = getSingleItemConversionDescription(recipe)

        expect(description).toBe('1g Recipe = 1g Ingredient')
      })

      it('handles large multipliers correctly', () => {
        const items = [makeItem(1, 'Water')]
        const recipe = {
          ...makeRecipe(items, 10),
          name: 'Dried Food',
        }

        const description = getSingleItemConversionDescription(recipe)

        expect(description).toBe('1g Dried Food = 10g Water')
      })

      it('handles small multipliers correctly', () => {
        const items = [makeItem(1, 'Fresh Food')]
        const recipe = {
          ...makeRecipe(items, 0.45),
          name: 'Cooked Food',
        }

        const description = getSingleItemConversionDescription(recipe)

        expect(description).toBe('1g Cooked Food = 0,45g Fresh Food')
      })
    })

    describe('Single-item recipe nutrient calculations', () => {
      it('scales nutrients correctly with prepared multiplier for single-item recipe', () => {
        // Raw pasta: 100g with 25g carbs, 8g protein, 1g fat
        const rawPasta = createItem({
          id: 1,
          name: 'Macarrão cru',
          quantity: 100,
          reference: {
            type: 'food' as const,
            id: 1,
            macros: createMacroNutrients({ carbsInGrams: 25, proteinInGrams: 8, fatInGrams: 1 }),
          },
        })

        // Cooked pasta recipe with 2.22 multiplier
        // This means 100g raw pasta becomes ~222g cooked pasta
        const cookedPastaRecipe = makeRecipe([rawPasta], 2.22)

        // Raw quantity should be 100g
        expect(getRecipeRawQuantity(cookedPastaRecipe)).toBe(100)

        // Prepared quantity should be 222g
        expect(getRecipePreparedQuantity(cookedPastaRecipe)).toBeCloseTo(222)
      })

      it('scales single-item recipe to desired prepared quantity', () => {
        const rawPasta = createItem({
          id: 1,
          name: 'Macarrão cru',
          quantity: 100,
          reference: {
            type: 'food' as const,
            id: 1,
            macros: createMacroNutrients({ carbsInGrams: 25, proteinInGrams: 8, fatInGrams: 1 }),
          },
        })

        const cookedPastaRecipe = makeRecipe([rawPasta], 2.22)

        // Scale to get 100g of cooked pasta
        const result = scaleRecipeByPreparedQuantity(cookedPastaRecipe, 100)

        // Scaling factor should be 100 / 222 ≈ 0.45
        expect(result.scalingFactor).toBeCloseTo(0.45, 1)

        // The raw pasta needed should be ~45g
        expect(result.scaledItems[0]?.quantity).toBeCloseTo(45, 0)
      })
    })
  })
})
