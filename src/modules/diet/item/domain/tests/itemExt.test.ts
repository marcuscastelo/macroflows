import { describe, expect, it } from 'vitest'

import { ItemExt } from '~/modules/diet/item/domain/ext/itemExt'
import type { Item } from '~/modules/diet/item/schema/itemSchema'
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
  __type: 'UnifiedItem' as const,
})

const makeRecipeItem = (
  id: number,
  name: string,
  quantity: number,
  children: Item[] = [],
): Item => ({
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

describe('ItemExt macros and of()', () => {
  it('calculates macros for a food item proportionally to quantity', () => {
    const food = makeFoodItem(1, 'Apple', 150, {
      protein: 10,
      carbs: 20,
      fat: 5,
    })

    const macros = ItemExt.macros(food)

    // macros stored are per 100g, so for 150g multiply by 1.5
    expect(macros.protein).toBeCloseTo((10 * 150) / 100)
    expect(macros.carbs).toBeCloseTo((20 * 150) / 100)
    expect(macros.fat).toBeCloseTo((5 * 150) / 100)
  })

  it('calculates macros for a recipe (container) by summing children directly (no scaling)', () => {
    const child1 = makeFoodItem(10, 'Flour', 100, {
      protein: 5,
      carbs: 70,
      fat: 1,
    })
    const child2 = makeFoodItem(11, 'Sugar', 50, {
      protein: 0,
      carbs: 100,
      fat: 0,
    })

    // RecipeItem quantity is 300 (the mainQuantity/prepared amount),
    // but macros should be calculated directly from children, not scaled.
    // This is because for recipes, the mainQuantity includes the multiplier effect
    // (e.g., water absorption), but the nutritional value is determined by the raw ingredients.
    const recipe = makeRecipeItem(2, 'Cookie mix', 300, [child1, child2])

    const macros = ItemExt.macros(recipe)

    // Expected: sum of children macros WITHOUT scaling by quantity ratio
    const child1Macros = ItemExt.macros(child1)
    const child2Macros = ItemExt.macros(child2)
    const expected = {
      protein: child1Macros.protein + child2Macros.protein,
      carbs: child1Macros.carbs + child2Macros.carbs,
      fat: child1Macros.fat + child2Macros.fat,
    }

    expect(macros.protein).toBeCloseTo(expected.protein)
    expect(macros.carbs).toBeCloseTo(expected.carbs)
    expect(macros.fat).toBeCloseTo(expected.fat)
  })

  it('recipe item multiplier only affects mainQuantity, NOT macro calculations', () => {
    // This test verifies the fix for issue #1417:
    // Recipe multiplier should only affect the displayed quantity (mainQuantity),
    // not the nutritional values (macros/calories).

    // 100g raw pasta with macros per 100g: 25g carbs, 8g protein, 1g fat
    const rawPasta = makeFoodItem(1, 'Raw Pasta', 100, {
      protein: 8,
      carbs: 25,
      fat: 1,
    })

    // Case 1: Recipe item with multiplier effect (quantity = 150, representing prepared weight)
    // The 100g raw pasta becomes 150g cooked pasta (multiplier = 1.5)
    // But the macros should still be based on the 100g raw pasta
    const cookedPastaWithMultiplier = makeRecipeItem(
      2,
      'Cooked Pasta',
      150, // mainQuantity with multiplier effect
      [rawPasta],
    )

    // Case 2: Recipe item without multiplier effect (quantity = 100, same as raw weight)
    const pastaNoMultiplier = makeRecipeItem(3, 'Pasta No Multiplier', 100, [
      rawPasta,
    ])

    const macrosWithMultiplier = ItemExt.macros(cookedPastaWithMultiplier)
    const macrosNoMultiplier = ItemExt.macros(pastaNoMultiplier)

    // CRITICAL: Both should have the SAME macros because the multiplier
    // only affects the displayed quantity, not the nutritional content.
    // The macros come from the children (raw pasta = 100g)
    expect(macrosWithMultiplier.protein).toBeCloseTo(macrosNoMultiplier.protein)
    expect(macrosWithMultiplier.carbs).toBeCloseTo(macrosNoMultiplier.carbs)
    expect(macrosWithMultiplier.fat).toBeCloseTo(macrosNoMultiplier.fat)

    // The raw pasta macros (100g * macros/100g)
    const expectedMacros = ItemExt.macros(rawPasta)
    expect(macrosWithMultiplier.protein).toBeCloseTo(expectedMacros.protein)
    expect(macrosWithMultiplier.carbs).toBeCloseTo(expectedMacros.carbs)
    expect(macrosWithMultiplier.fat).toBeCloseTo(expectedMacros.fat)
  })

  it('ItemExt.of returns helpful helpers and type guards', () => {
    const food = makeFoodItem(5, 'Banana', 100, {
      protein: 1,
      carbs: 25,
      fat: 0,
    })
    const ext = ItemExt.of(food)

    expect(ext.quantity()).toBe(food.quantity)
    expect(ext.reference()).toBe(food.reference)
    expect(ext.isFoodItem()).toBe(true)
    expect(ext.isRecipeItem()).toBe(false)
    expect(ext.ifFoodItem((f) => f.name, 'x')).toBe('Banana')
  })
})
