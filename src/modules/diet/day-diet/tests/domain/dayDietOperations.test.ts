import { describe, expect, it } from 'vitest'

import type { DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import {
  createNewDayDiet,
  promoteDayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import { updateMealInDayDiet } from '~/modules/diet/day-diet/domain/dayDietOperations'
import { createItem } from '~/modules/diet/item/schema/itemSchema'
import { createMacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { createNewMeal, promoteMeal } from '~/modules/diet/meal/domain/meal'

function makeItem(id: number, name = 'Arroz') {
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

function makeMeal(id: number, name = 'Almoço', items = [makeItem(1)]) {
  return promoteMeal(createNewMeal({ name, items }), { id })
}

const baseItem = makeItem(1)
const baseMeal = makeMeal(1, 'Almoço', [baseItem])
const baseDayDiet: DayDiet = promoteDayDiet(
  createNewDayDiet({
    target_day: '2023-01-01',
    user_id: '1',
    meals: [baseMeal],
  }),
  { id: 1 },
)

describe('dayDietOperations', () => {
  describe('updateMealInDayDiet', () => {
    it('should update a meal in the day diet', () => {
      const updated = makeMeal(1, 'Jantar', [baseItem])
      const result = updateMealInDayDiet(baseDayDiet, 1, updated)
      expect(result.meals[0]?.name).toBe('Jantar')
    })

    it('should return the original DayDiet if mealId does not exist', () => {
      const nonExistentMealId = 999
      const updated = makeMeal(nonExistentMealId, 'Non Existent', [])
      const result = updateMealInDayDiet(
        baseDayDiet,
        nonExistentMealId,
        updated,
      )
      expect(result).toEqual(baseDayDiet)
    })

    it('should preserve other meals in the DayDiet', () => {
      const meal2 = makeMeal(2, 'Café da Manhã', [makeItem(2)])
      const dayDietWithTwoMeals = promoteDayDiet(
        createNewDayDiet({
          target_day: '2023-01-01',
          user_id: '1',
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

    it('should preserve other properties of the DayDiet', () => {
      const updated = makeMeal(1, 'Jantar', [baseItem])
      const result = updateMealInDayDiet(baseDayDiet, 1, updated)

      expect(result.target_day).toBe(baseDayDiet.target_day)
      expect(result.user_id).toBe(baseDayDiet.user_id)
      expect(result.id).toBe(baseDayDiet.id)
    })
  })
})
