import { describe, expect, it, vi } from 'vitest'

import { createDayEditOrchestrator } from '~/modules/diet/day-diet/application/usecases/dayEditOrchestrator'
import {
  createNewDayDiet,
  promoteDayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import { createItem } from '~/modules/diet/item/schema/itemSchema'
import { createMacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { macroTargetUseCases } from '~/modules/diet/macro-target/application/macroTargetUseCases'
import { updateMeal } from '~/modules/diet/meal/application/meal'
import { createNewMeal, promoteMeal } from '~/modules/diet/meal/domain/meal'
import {
  addItemToMeal,
  updateItemInMeal,
} from '~/modules/diet/meal/domain/mealOperations'
// Mock dependencies
vi.mock('~/modules/diet/macro-target/application/macroTarget', () => ({
  getMacroTargetForDay: vi.fn(),
}))

vi.mock('~/modules/diet/meal/application/meal', () => ({
  updateMeal: vi.fn(),
}))

vi.mock('~/shared/utils/date/dateUtils', () => ({
  stringToDate: vi.fn(() => new Date('2023-01-01')),
  getTodayYYYYMMDD: vi.fn(() => '2023-01-01'),
}))

function makeTestItem(id = 1) {
  return createItem({
    id,
    name: 'Test Item',
    quantity: 100,
    reference: {
      type: 'food' as const,
      id,
      macros: createMacroNutrients({
        carbsInGrams: 10,
        proteinInGrams: 2,
        fatInGrams: 1,
      }),
    },
  })
}

function makeTestMeal(id = 1) {
  return promoteMeal(
    createNewMeal({ name: 'Test Meal', items: [makeTestItem()] }),
    { id },
  )
}

function makeTestDayDiet() {
  return promoteDayDiet(
    createNewDayDiet({
      target_day: '2023-01-01',
      user_id: '1',
      meals: [makeTestMeal()],
    }),
    { id: 1 },
  )
}

// Create instance for testing
const dayUseCases = createDayEditOrchestrator({
  macroTargetAt: (d: Date) => macroTargetUseCases.macroTargetAt(d),
  updateMeal,
  addItemToMeal,
  updateItemInMeal,
})

describe('DayEditdayUseCases', () => {
  describe('checkEditPermission', () => {
    it('should allow editing when mode is edit', () => {
      const result = dayUseCases.checkEditPermission('edit')

      expect(result.canEdit).toBe(true)
    })

    it('should deny editing when mode is summary', () => {
      const result = dayUseCases.checkEditPermission('summary')

      expect(result.canEdit).toBe(false)
      if (!result.canEdit) {
        expect(result.reason).toBe('Summary mode')
      }
    })

    it('should deny editing when mode is read-only', () => {
      const result = dayUseCases.checkEditPermission('read-only')

      expect(result.canEdit).toBe(false)
      if (!result.canEdit) {
        expect(result.reason).toBe('Day not editable')
        expect(result.title).toBe('Dia não editável')
        expect(result.confirmText).toBe('Desbloquear')
        expect(result.cancelText).toBe('Cancelar')
      }
    })
  })

  describe('prepareMacroOverflowConfig', () => {
    it('should enable macro overflow when macro target exists', () => {
      const mockMacroTarget = createMacroNutrients({
        carbsInGrams: 100,
        proteinInGrams: 50,
        fatInGrams: 30,
      })
      vi.spyOn(macroTargetUseCases, 'macroTargetAt').mockReturnValue(
        mockMacroTarget,
      )

      const dayDiet = makeTestDayDiet()
      const item = makeTestItem()

      const result = dayUseCases.prepareMacroOverflowConfig(dayDiet, item)

      expect(result.enable).toBe(true)
      expect(result.originalItem).toBe(item)
    })

    it('should disable macro overflow when no macro target exists', () => {
      vi.spyOn(macroTargetUseCases, 'macroTargetAt').mockReturnValue(null)

      const dayDiet = makeTestDayDiet()
      const item = makeTestItem()

      const result = dayUseCases.prepareMacroOverflowConfig(dayDiet, item)

      expect(result.enable).toBe(false)
      expect(result.originalItem).toBeUndefined()
    })
  })

  describe('updateMealOrchestrated', () => {
    it('should call updateMeal with correct parameters', async () => {
      vi.mocked(updateMeal).mockResolvedValue(true)

      const meal = makeTestMeal()

      await dayUseCases.updateMealOrchestrated(meal)

      expect(updateMeal).toHaveBeenCalledWith(meal.id, meal)
    })

    it('should propagate errors with proper context', async () => {
      const error = new Error('Update failed')
      vi.mocked(updateMeal).mockRejectedValue(error)

      const meal = makeTestMeal()

      await expect(dayUseCases.updateMealOrchestrated(meal)).rejects.toThrow(
        'Update failed',
      )
    })
  })

  describe('addItemToMealOrchestrated', () => {
    it('should update meal with new item', async () => {
      vi.mocked(updateMeal).mockResolvedValue(true)

      const meal = makeTestMeal()
      const newItem = makeTestItem(2)

      await dayUseCases.addItemToMealOrchestrated(meal, newItem)

      expect(updateMeal).toHaveBeenCalledWith(meal.id, expect.any(Object))
    })
  })

  describe('updateItemInMealOrchestrated', () => {
    it('should update specific item in meal', async () => {
      vi.mocked(updateMeal).mockResolvedValue(true)

      const meal = makeTestMeal()
      const originalItem = meal.items[0]!
      const updatedItem = createItem({
        ...originalItem,
        name: 'Updated Item',
      })

      await dayUseCases.updateItemInMealOrchestrated(
        meal,
        originalItem,
        updatedItem,
      )

      expect(updateMeal).toHaveBeenCalledWith(meal.id, expect.any(Object))
    })
  })
})
