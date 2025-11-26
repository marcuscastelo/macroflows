import { describe, expect, it } from 'vitest'

import { createMacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { ItemExt } from '~/modules/diet/unified-item/domain/ext/itemExt'
import type { Item } from '~/modules/diet/unified-item/schema/itemSchema'

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
): Item => ({
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

  it('calculates macros for a recipe (container) by summing children and scaling to container quantity', () => {
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

    // defaultQuantity = 150, default macros = sum of child macros
    const recipe = makeRecipeItem(2, 'Cookie mix', 300, [child1, child2])

    const macros = ItemExt.macros(recipe)

    // scaling factor = 300 / 150 = 2
    // calculate expected default macros:
    const child1Macros = ItemExt.macros(child1)
    const child2Macros = ItemExt.macros(child2)
    const expected = {
      protein:
        (child1Macros.protein + child2Macros.protein) *
        (300 / (child1.quantity + child2.quantity)),
      carbs:
        (child1Macros.carbs + child2Macros.carbs) *
        (300 / (child1.quantity + child2.quantity)),
      fat:
        (child1Macros.fat + child2Macros.fat) *
        (300 / (child1.quantity + child2.quantity)),
    }

    expect(macros.protein).toBeCloseTo(expected.protein)
    expect(macros.carbs).toBeCloseTo(expected.carbs)
    expect(macros.fat).toBeCloseTo(expected.fat)
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
