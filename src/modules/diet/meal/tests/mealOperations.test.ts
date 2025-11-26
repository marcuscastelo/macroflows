import { describe, expect, it } from 'vitest'

import { createMacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { createNewMeal, promoteMeal } from '~/modules/diet/meal/domain/meal'
import {
  addItemsToMeal,
  removeItemFromMeal,
  setMealItems,
  updateItemInMeal,
} from '~/modules/diet/meal/domain/mealOperations'
import { createItem } from '~/modules/diet/unified-item/schema/itemSchema'

function makeUnifiedItem(id: number, name = 'Arroz') {
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

function makeMeal(id: number, name = 'Almoço', items = [makeUnifiedItem(1)]) {
  return promoteMeal(createNewMeal({ name, items }), { id })
}

const baseUnifiedItem = makeUnifiedItem(1)
const baseMeal = makeMeal(1, 'Almoço', [baseUnifiedItem])

describe('mealOperations', () => {
  it('addItemsToMeal adds multiple items', () => {
    const items = [makeUnifiedItem(2, 'Feijão'), makeUnifiedItem(3, 'Carne')]
    const result = addItemsToMeal(baseMeal, items)
    expect(result.items).toHaveLength(3)
  })

  it('updateItemInMeal updates an item', () => {
    const updatedItem = createItem({
      ...baseUnifiedItem,
      name: 'Arroz Integral',
    })
    const result = updateItemInMeal(baseMeal, 1, updatedItem)
    expect(result.items[0]?.name).toBe('Arroz Integral')
  })

  it('removeItemFromMeal removes an item', () => {
    const result = removeItemFromMeal(baseMeal, 1)
    expect(result.items).toHaveLength(0)
  })

  it('setMealItems sets items', () => {
    const items = [makeUnifiedItem(2, 'Feijão')]
    const result = setMealItems(baseMeal, items)
    expect(result.items).toEqual(items)
  })
})
