import { describe, expect, it } from 'vitest'

import { ItemExt } from '~/modules/diet/item/domain/ext/itemExt'
import type { Item } from '~/modules/diet/item/schema/itemSchema'
import { MacroNutrientsExt } from '~/modules/diet/macro-nutrients/domain/macroExt'
import {
  createMacroNutrients,
  type MacroNutrientsRecord,
} from '~/modules/diet/macro-nutrients/domain/macroNutrients'

const makeFoodItem = (
  id: number,
  name: string,
  quantity: number,
  macros: MacroNutrientsRecord,
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
      proteinInMg: 10000,
      carbsInMg: 20000,
      fatInMg: 5000,
    })

    const macros = ItemExt.macros(food)
    const macrosExt = MacroNutrientsExt.of(macros)

    // macros stored are per 100g, so for 150g multiply by 1.5
    expect(macrosExt.proteinInGrams()).toBeCloseTo((10 * 150) / 100)
    expect(macrosExt.carbsInGrams()).toBeCloseTo((20 * 150) / 100)
    expect(macrosExt.fatInGrams()).toBeCloseTo((5 * 150) / 100)
  })

  it('calculates macros for a recipe (container) by summing children directly (no scaling)', () => {
    const child1 = makeFoodItem(10, 'Flour', 100, {
      proteinInMg: 5000,
      carbsInMg: 70000,
      fatInMg: 1000,
    })
    const child2 = makeFoodItem(11, 'Sugar', 50, {
      proteinInMg: 0,
      carbsInMg: 100000,
      fatInMg: 0,
    })

    // RecipeItem quantity is 300 (the mainQuantity/prepared amount),
    // but macros should be calculated directly from children, not scaled.
    // This is because for recipes, the mainQuantity includes the multiplier effect
    // (e.g., water absorption), but the nutritional value is determined by the raw ingredients.
    const recipe = makeRecipeItem(2, 'Cookie mix', 300, [child1, child2])

    const macros = ItemExt.macros(recipe)
    const macrosExt = MacroNutrientsExt.of(macros)

    // Expected: sum of children macros WITHOUT scaling by quantity ratio
    const child1Macros = ItemExt.macros(child1)
    const child1MacrosExt = MacroNutrientsExt.of(child1Macros)
    const child2Macros = ItemExt.macros(child2)
    const child2MacrosExt = MacroNutrientsExt.of(child2Macros)
    const expected = {
      protein:
        child1MacrosExt.proteinInGrams() + child2MacrosExt.proteinInGrams(),
      carbs: child1MacrosExt.carbsInGrams() + child2MacrosExt.carbsInGrams(),
      fat: child1MacrosExt.fatInGrams() + child2MacrosExt.fatInGrams(),
    }

    expect(macrosExt.proteinInGrams()).toBeCloseTo(expected.protein)
    expect(macrosExt.carbsInGrams()).toBeCloseTo(expected.carbs)
    expect(macrosExt.fatInGrams()).toBeCloseTo(expected.fat)
  })

  it('recipe item multiplier only affects mainQuantity, NOT macro calculations', () => {
    // This test verifies the fix for issue #1417:
    // Recipe multiplier should only affect the displayed quantity (mainQuantity),
    // not the nutritional values (macros/calories).

    // 100g raw pasta with macros per 100g: 25g carbs, 8g protein, 1g fat
    const rawPasta = makeFoodItem(1, 'Raw Pasta', 100, {
      proteinInMg: 8000,
      carbsInMg: 25000,
      fatInMg: 1000,
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
    const macrosExtWithMultiplier = MacroNutrientsExt.of(macrosWithMultiplier)
    const macrosNoMultiplier = ItemExt.macros(pastaNoMultiplier)
    const macrosExtNoMultiplier = MacroNutrientsExt.of(macrosNoMultiplier)

    // CRITICAL: Both should have the SAME macros because the multiplier
    // only affects the displayed quantity, not the nutritional content.
    // The macros come from the children (raw pasta = 100g)
    expect(macrosExtWithMultiplier.proteinInGrams()).toBeCloseTo(
      macrosExtNoMultiplier.proteinInGrams(),
    )
    expect(macrosExtWithMultiplier.carbsInGrams()).toBeCloseTo(
      macrosExtNoMultiplier.carbsInGrams(),
    )
    expect(macrosExtWithMultiplier.fatInGrams()).toBeCloseTo(
      macrosExtNoMultiplier.fatInGrams(),
    )

    // The raw pasta macros (100g * macros/100g)
    const expectedMacros = ItemExt.macros(rawPasta)
    const expectedMacrosExt = MacroNutrientsExt.of(expectedMacros)

    // Verify against expected macros from raw pasta
    expect(macrosExtWithMultiplier.proteinInGrams()).toBeCloseTo(
      expectedMacrosExt.proteinInGrams(),
    )
    expect(macrosExtWithMultiplier.carbsInGrams()).toBeCloseTo(
      expectedMacrosExt.carbsInGrams(),
    )
    expect(macrosExtWithMultiplier.fatInGrams()).toBeCloseTo(
      expectedMacrosExt.fatInGrams(),
    )
  })

  it('ItemExt.of returns helpful helpers and type guards', () => {
    const food = makeFoodItem(5, 'Banana', 100, {
      proteinInMg: 1000,
      carbsInMg: 25000,
      fatInMg: 0,
    })
    const ext = ItemExt.of(food)

    expect(ext.quantity()).toBe(food.quantity)
    expect(ext.reference()).toBe(food.reference)
    expect(ext.isFoodItem()).toBe(true)
    expect(ext.isRecipeItem()).toBe(false)
    expect(ext.ifFoodItem((f) => f.name, 'x')).toBe('Banana')
  })
})
