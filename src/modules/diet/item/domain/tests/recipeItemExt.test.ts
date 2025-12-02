import { describe, expect, it } from 'vitest'

import { RecipeItemExt } from '~/modules/diet/item/domain/ext/recipeItemExt'
import type { Item, RecipeItem } from '~/modules/diet/item/schema/itemSchema'
import { createMacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { type Recipe } from '~/modules/diet/recipe/domain/recipe'

const makeFoodItem = (
  id: number,
  name: string,
  quantity: number,
  macros: { protein: number; carbs: number; fat: number },
): Item => ({
  id,
  name,
  quantity,
  reference: {
    type: 'food',
    id,
    macros: createMacroNutrients(macros),
  },
  __type: 'UnifiedItem' as const,
})

const makeRecipeItem = (
  id: number,
  name: string,
  quantity: number,
  children: Item[] = [],
): RecipeItem => ({
  id,
  name,
  quantity,
  reference: {
    type: 'recipe',
    id,
    children,
  },
  __type: 'UnifiedItem' as const,
})

const makeRecipe = (
  id: number,
  name: string,
  items: Item[],
  prepared_multiplier = 1,
): Recipe => ({
  id,
  name,
  items,
  prepared_multiplier,
  user_id: '',
  __type: 'Recipe',
})

describe('RecipeItemExt', () => {
  it('syncWithOriginal replaces children with originals and updates parent quantity', () => {
    const original: Item = makeFoodItem(100, 'Original Apple', 200, {
      protein: 2,
      carbs: 50,
      fat: 0,
    })

    const modifiedChild: Item = makeFoodItem(100, 'Modified Apple', 150, {
      protein: 2,
      carbs: 37.5,
      fat: 0,
    })

    const recipe = makeRecipeItem(1, 'Apple Recipe', 1, [modifiedChild])

    const synced = RecipeItemExt.syncWithOriginal(recipe, [original])

    expect(synced.reference.type).toBe('recipe')
    expect(synced.reference.children).toHaveLength(1)
    const syncedChild = synced.reference.children[0]!

    // Should have original values
    expect(syncedChild.id).toBe(original.id)
    expect(syncedChild.name).toBe(original.name)
    expect(syncedChild.quantity).toBe(original.quantity)

    // Parent should have total quantity equal to sum of children
    expect(synced.quantity).toBe(original.quantity)
  })

  it('scaleQuantityAndChildren scales children and enforces minima/rounding', () => {
    const child = makeFoodItem(1, 'Flour', 100, {
      protein: 10,
      carbs: 70,
      fat: 1,
    })
    const recipeItem = makeRecipeItem(2, 'Bread', 200, [child])
    const recipe: Recipe = {
      id: 2,
      name: 'Bread',
      prepared_multiplier: 2, // 1 unit of recipe = 2 units prepared
      items: [child],
      user_id: '',
      __type: 'Recipe',
    }

    const scaled = RecipeItemExt.scaleQuantityAndChildren(
      recipeItem,
      recipe,
      1000,
    )

    // parent doubled
    expect(scaled.quantity).toBe(1000)

    expect(scaled.reference.children[0]!.quantity).toBeCloseTo(500)

    // Scaling down to very small should enforce minima
    const tinyScaled = RecipeItemExt.scaleQuantityAndChildren(
      recipeItem,
      recipe,
      0.001,
    )
    expect(tinyScaled.quantity).toBe(0.01) // main min
    expect(tinyScaled.reference.children[0]!.quantity).toBeGreaterThanOrEqual(
      0.0001,
    )
  })

  describe('isInSyncWithRecipe', () => {
    it('returns true for single-item recipe with scaled quantity (issue #1417)', () => {
      // Single-item recipe (e.g., raw -> cooked conversion)
      const rawPasta = makeFoodItem(1, 'Raw Pasta', 100, {
        protein: 8,
        carbs: 25,
        fat: 1,
      })
      const recipe = makeRecipe(1, 'Cooked Pasta', [rawPasta], 2.22)

      // User's recipe item with scaled quantity (half portion)
      const scaledPasta = makeFoodItem(1, 'Raw Pasta', 50, {
        protein: 8,
        carbs: 25,
        fat: 1,
      })
      const recipeItem = makeRecipeItem(1, 'Cooked Pasta', 111, [scaledPasta])

      expect(RecipeItemExt.isInSyncWithRecipe(recipeItem, recipe)).toBe(true)
    })

    it('returns true for multi-item recipe with scaled quantity preserving proportions (issue #1417)', () => {
      // Multi-item recipe (e.g., sandwich with bread, butter, cheese)
      const bread = makeFoodItem(1, 'Bread', 100, {
        protein: 8,
        carbs: 50,
        fat: 2,
      })
      const butter = makeFoodItem(2, 'Butter', 30, {
        protein: 0,
        carbs: 0,
        fat: 80,
      })
      const cheese = makeFoodItem(3, 'Cheese', 70, {
        protein: 25,
        carbs: 2,
        fat: 30,
      })
      const recipe = makeRecipe(1, 'Sandwich', [bread, butter, cheese], 1)

      // User's recipe item with scaled quantity (half portion - 100g instead of 200g)
      // Proportions are preserved: 50% bread, 15% butter, 35% cheese
      const scaledBread = makeFoodItem(1, 'Bread', 50, {
        protein: 8,
        carbs: 50,
        fat: 2,
      })
      const scaledButter = makeFoodItem(2, 'Butter', 15, {
        protein: 0,
        carbs: 0,
        fat: 80,
      })
      const scaledCheese = makeFoodItem(3, 'Cheese', 35, {
        protein: 25,
        carbs: 2,
        fat: 30,
      })
      const recipeItem = makeRecipeItem(1, 'Sandwich', 100, [
        scaledBread,
        scaledButter,
        scaledCheese,
      ])

      expect(RecipeItemExt.isInSyncWithRecipe(recipeItem, recipe)).toBe(true)
    })

    it('returns true for multi-item recipe after scaling with rounding (issue #1417 edge case)', () => {
      // This test case specifically reproduces the bug where rounding causes
      // normalized proportions to differ slightly
      const item1 = makeFoodItem(1, 'Item 1', 33.33, {
        protein: 10,
        carbs: 10,
        fat: 10,
      })
      const item2 = makeFoodItem(2, 'Item 2', 33.33, {
        protein: 10,
        carbs: 10,
        fat: 10,
      })
      const item3 = makeFoodItem(3, 'Item 3', 33.34, {
        protein: 10,
        carbs: 10,
        fat: 10,
      })
      const recipe = makeRecipe(1, 'Test Recipe', [item1, item2, item3], 1)

      // After scaling to half (50g), with rounding to 2 decimal places:
      // 33.33/100 * 50 = 16.665 -> 16.67
      // 33.33/100 * 50 = 16.665 -> 16.67
      // 33.34/100 * 50 = 16.67 -> 16.67
      // Total after rounding: 50.01 (not exactly 50 due to rounding)
      const scaledItem1 = makeFoodItem(1, 'Item 1', 16.67, {
        protein: 10,
        carbs: 10,
        fat: 10,
      })
      const scaledItem2 = makeFoodItem(2, 'Item 2', 16.67, {
        protein: 10,
        carbs: 10,
        fat: 10,
      })
      const scaledItem3 = makeFoodItem(3, 'Item 3', 16.67, {
        protein: 10,
        carbs: 10,
        fat: 10,
      })
      const recipeItem = makeRecipeItem(1, 'Test Recipe', 50.01, [
        scaledItem1,
        scaledItem2,
        scaledItem3,
      ])

      // Should be in sync despite slight rounding differences in normalized proportions
      expect(RecipeItemExt.isInSyncWithRecipe(recipeItem, recipe)).toBe(true)
    })

    it('returns true when multiplying total quantity by 1.0 (noop case)', () => {
      const bread = makeFoodItem(1, 'Bread', 100, {
        protein: 8,
        carbs: 50,
        fat: 2,
      })
      const butter = makeFoodItem(2, 'Butter', 50, {
        protein: 0,
        carbs: 0,
        fat: 80,
      })
      const recipe = makeRecipe(1, 'Toast', [bread, butter], 1)

      // Recipe item with exact same quantities as recipe
      const recipeItem = makeRecipeItem(1, 'Toast', 150, [bread, butter])

      expect(RecipeItemExt.isInSyncWithRecipe(recipeItem, recipe)).toBe(true)
    })

    it('returns false when item is added to recipe item children', () => {
      const bread = makeFoodItem(1, 'Bread', 100, {
        protein: 8,
        carbs: 50,
        fat: 2,
      })
      const recipe = makeRecipe(1, 'Bread Recipe', [bread], 1)

      // User added butter to the recipe item
      const extraButter = makeFoodItem(2, 'Butter', 20, {
        protein: 0,
        carbs: 0,
        fat: 80,
      })
      const recipeItem = makeRecipeItem(1, 'Bread Recipe', 120, [
        bread,
        extraButter,
      ])

      expect(RecipeItemExt.isInSyncWithRecipe(recipeItem, recipe)).toBe(false)
    })

    it('returns false when item is removed from recipe item children', () => {
      const bread = makeFoodItem(1, 'Bread', 100, {
        protein: 8,
        carbs: 50,
        fat: 2,
      })
      const butter = makeFoodItem(2, 'Butter', 50, {
        protein: 0,
        carbs: 0,
        fat: 80,
      })
      const recipe = makeRecipe(1, 'Toast', [bread, butter], 1)

      // User removed butter from the recipe item
      const recipeItem = makeRecipeItem(1, 'Toast', 100, [bread])

      expect(RecipeItemExt.isInSyncWithRecipe(recipeItem, recipe)).toBe(false)
    })

    it('returns false when proportions are changed in recipe item children', () => {
      const bread = makeFoodItem(1, 'Bread', 100, {
        protein: 8,
        carbs: 50,
        fat: 2,
      })
      const butter = makeFoodItem(2, 'Butter', 50, {
        protein: 0,
        carbs: 0,
        fat: 80,
      })
      const recipe = makeRecipe(1, 'Toast', [bread, butter], 1)
      // Original proportions: bread 66.67%, butter 33.33%

      // User changed proportions to 50% bread, 50% butter
      const modifiedBread = makeFoodItem(1, 'Bread', 75, {
        protein: 8,
        carbs: 50,
        fat: 2,
      })
      const modifiedButter = makeFoodItem(2, 'Butter', 75, {
        protein: 0,
        carbs: 0,
        fat: 80,
      })
      const recipeItem = makeRecipeItem(1, 'Toast', 150, [
        modifiedBread,
        modifiedButter,
      ])

      expect(RecipeItemExt.isInSyncWithRecipe(recipeItem, recipe)).toBe(false)
    })

    it('returns false when item name is changed in recipe item children', () => {
      const bread = makeFoodItem(1, 'Bread', 100, {
        protein: 8,
        carbs: 50,
        fat: 2,
      })
      const recipe = makeRecipe(1, 'Bread Recipe', [bread], 1)

      // User renamed the bread
      const renamedBread = makeFoodItem(1, 'Whole Wheat Bread', 100, {
        protein: 8,
        carbs: 50,
        fat: 2,
      })
      const recipeItem = makeRecipeItem(1, 'Bread Recipe', 100, [renamedBread])

      expect(RecipeItemExt.isInSyncWithRecipe(recipeItem, recipe)).toBe(false)
    })
  })
})
