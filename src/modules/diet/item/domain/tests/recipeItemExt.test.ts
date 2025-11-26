import { describe, expect, it } from 'vitest'

import { RecipeItemExt } from '~/modules/diet/item/domain/ext/recipeItemExt'
import type { Item, RecipeItem } from '~/modules/diet/item/schema/itemSchema'
import { createMacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'

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
  __type: 'Item' as const,
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
  __type: 'Item' as const,
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
    const recipe = makeRecipeItem(2, 'Bread', 500, [child])

    const scaled = RecipeItemExt.scaleQuantityAndChildren(recipe, 1000)

    // parent doubled
    expect(scaled.quantity).toBe(1000)

    expect(scaled.reference.children[0]!.quantity).toBeCloseTo(200)

    // Scaling down to very small should enforce minima
    const tinyScaled = RecipeItemExt.scaleQuantityAndChildren(recipe, 0.001)
    expect(tinyScaled.quantity).toBe(0.01) // main min
    expect(tinyScaled.reference.children[0]!.quantity).toBeGreaterThanOrEqual(
      0.0001,
    )
  })
})
