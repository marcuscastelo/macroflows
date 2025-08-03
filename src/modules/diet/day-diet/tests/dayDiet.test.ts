import { describe, expect, it } from 'vitest'

import type { DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import {
  createNewDayDiet,
  promoteDayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import { updateMealInDayDiet } from '~/modules/diet/day-diet/domain/dayDietOperations'
import { createMacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { createNewMeal, promoteMeal } from '~/modules/diet/meal/domain/meal'
import { createUnifiedItem } from '~/modules/diet/unified-item/schema/unifiedItemSchema'

function makeUnifiedItem(id: number, name = 'Arroz') {
  return createUnifiedItem({
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

const baseItem = makeUnifiedItem(1)
const baseMeal = makeMeal(1, 'Almoço', [baseItem])
const baseDayDiet: DayDiet = promoteDayDiet(
  createNewDayDiet({
    target_day: '2023-01-01',
    owner: 1,
    meals: [baseMeal],
  }),
  { id: 1 },
)

describe('dayDietOperations', () => {
  it('updateMealInDayDiet updates a meal', () => {
    const updated = makeMeal(1, 'Jantar', [baseItem])
    const result = updateMealInDayDiet(baseDayDiet, 1, updated)
    expect(result.meals[0]?.name).toBe('Jantar')
  })

  it('updateMealInDayDiet should return the original DayDiet if mealId does not exist', () => {
    const nonExistentMealId = 999
    const updated = makeMeal(nonExistentMealId, 'Non Existent', [])
    const result = updateMealInDayDiet(baseDayDiet, nonExistentMealId, updated)
    expect(result).toEqual(baseDayDiet)
  })

  it('updateMealInDayDiet should preserve other meals in the DayDiet', () => {
    const meal2 = makeMeal(2, 'Café da Manhã', [makeUnifiedItem(2)])
    const dayDietWithTwoMeals = promoteDayDiet(
      createNewDayDiet({
        target_day: '2023-01-01',
        owner: 1,
        meals: [baseMeal, meal2],
      }),
      { id: 1 },
    )
    const updatedMeal1 = makeMeal(1, 'Almoço Atualizado', [baseItem])
    const result = updateMealInDayDiet(dayDietWithTwoMeals, 1, updatedMeal1)
    expect(result.meals).toHaveLength(2)
    expect(result.meals[0]?.name).toBe('Almoço Atualizado')
    expect(result.meals[1]).toEqual(meal2)
  })

  it('updateMealInDayDiet should preserve other properties of the DayDiet', () => {
    const updated = makeMeal(1, 'Jantar', [baseItem])
    const result = updateMealInDayDiet(baseDayDiet, 1, updated)
    expect(result.target_day).toBe(baseDayDiet.target_day)
    expect(result.owner).toBe(baseDayDiet.owner)
    expect(result.id).toBe(baseDayDiet.id)
  })
})
