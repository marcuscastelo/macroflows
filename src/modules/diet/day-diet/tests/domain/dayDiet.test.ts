import { describe, expect, it } from 'vitest'

import {
  createNewDayDiet,
  type DayDiet,
  demoteNewDayDiet,
  type NewDayDiet,
  promoteDayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import { createMacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { createNewMeal, promoteMeal } from '~/modules/diet/meal/domain/meal'
import { createUnifiedItem } from '~/modules/diet/unified-item/schema/unifiedItemSchema'

function makeTestMeal() {
  const item = createUnifiedItem({
    id: 1,
    name: 'Arroz',
    quantity: 100,
    reference: {
      type: 'food' as const,
      id: 1,
      macros: createMacroNutrients({ carbs: 10, protein: 2, fat: 1 }),
    },
  })

  return promoteMeal(createNewMeal({ name: 'Almoço', items: [item] }), {
    id: 1,
  })
}

describe('DayDiet Factory Functions', () => {
  describe('createNewDayDiet', () => {
    it('should create a new day diet with required fields', () => {
      const meals = [makeTestMeal()]
      const newDayDiet = createNewDayDiet({
        target_day: '2023-01-01',
        owner: 1,
        meals,
      })

      expect(newDayDiet.target_day).toBe('2023-01-01')
      expect(newDayDiet.owner).toBe(1)
      expect(newDayDiet.meals).toEqual(meals)
      expect(newDayDiet.__type).toBe('NewDayDiet')
    })

    it('should create a day diet with empty meals array', () => {
      const newDayDiet = createNewDayDiet({
        target_day: '2023-01-01',
        owner: 1,
        meals: [],
      })

      expect(newDayDiet.meals).toEqual([])
      expect(newDayDiet.meals.length).toBe(0)
    })

    it('should preserve meal structure in created day diet', () => {
      const meals = [makeTestMeal()]
      const newDayDiet = createNewDayDiet({
        target_day: '2023-01-01',
        owner: 1,
        meals,
      })

      expect(newDayDiet.meals[0]?.name).toBe('Almoço')
      expect(newDayDiet.meals[0]?.items).toHaveLength(1)
      expect(newDayDiet.meals[0]?.items[0]?.name).toBe('Arroz')
    })
  })

  describe('promoteDayDiet', () => {
    it('should promote new day diet to day diet with id', () => {
      const newDayDiet = createNewDayDiet({
        target_day: '2023-01-01',
        owner: 1,
        meals: [],
      })

      const dayDiet = promoteDayDiet(newDayDiet, { id: 123 })

      expect(dayDiet.id).toBe(123)
      expect(dayDiet.target_day).toBe('2023-01-01')
      expect(dayDiet.owner).toBe(1)
      expect(dayDiet.__type).toBe('DayDiet')
    })

    it('should preserve all fields when promoting', () => {
      const meals = [makeTestMeal()]
      const newDayDiet = createNewDayDiet({
        target_day: '2023-12-25',
        owner: 42,
        meals,
      })

      const dayDiet = promoteDayDiet(newDayDiet, { id: 999 })

      expect(dayDiet.id).toBe(999)
      expect(dayDiet.target_day).toBe('2023-12-25')
      expect(dayDiet.owner).toBe(42)
      expect(dayDiet.meals).toEqual(meals)
    })
  })

  describe('demoteNewDayDiet', () => {
    it('should demote day diet back to new day diet', () => {
      const originalNewDayDiet = createNewDayDiet({
        target_day: '2023-01-01',
        owner: 1,
        meals: [],
      })
      const dayDiet = promoteDayDiet(originalNewDayDiet, { id: 123 })

      const demotedDayDiet = demoteNewDayDiet(dayDiet)

      expect(demotedDayDiet.target_day).toBe('2023-01-01')
      expect(demotedDayDiet.owner).toBe(1)
      expect(demotedDayDiet.meals).toEqual([])
      expect(demotedDayDiet.__type).toBe('NewDayDiet')
      expect('id' in demotedDayDiet).toBe(false)
    })

    it('should preserve meals when demoting', () => {
      const meals = [makeTestMeal()]
      const originalNewDayDiet = createNewDayDiet({
        target_day: '2023-01-01',
        owner: 1,
        meals,
      })
      const dayDiet = promoteDayDiet(originalNewDayDiet, { id: 123 })

      const demotedDayDiet = demoteNewDayDiet(dayDiet)

      expect(demotedDayDiet.meals).toEqual(meals)
      expect(demotedDayDiet.meals[0]?.name).toBe('Almoço')
    })
  })

  describe('Type Discrimination', () => {
    it('should correctly discriminate between NewDayDiet and DayDiet types', () => {
      const newDayDiet: NewDayDiet = createNewDayDiet({
        target_day: '2023-01-01',
        owner: 1,
        meals: [],
      })
      const dayDiet: DayDiet = promoteDayDiet(newDayDiet, { id: 1 })

      expect(newDayDiet.__type).toBe('NewDayDiet')
      expect(dayDiet.__type).toBe('DayDiet')

      // Type guard test
      function isDayDiet(item: NewDayDiet | DayDiet): item is DayDiet {
        return item.__type === 'DayDiet'
      }

      expect(isDayDiet(newDayDiet)).toBe(false)
      expect(isDayDiet(dayDiet)).toBe(true)
    })
  })
})
