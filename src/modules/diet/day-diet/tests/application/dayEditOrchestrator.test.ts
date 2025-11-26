import { describe, expect, it, vi } from 'vitest'

import { createDayEditOrchestrator } from '~/modules/diet/day-diet/application/usecases/dayEditOrchestrator'
import {
  createNewDayDiet,
  promoteDayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import { createMacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { createNewMeal, promoteMeal } from '~/modules/diet/meal/domain/meal'
import { createUnifiedItem } from '~/modules/diet/unified-item/schema/unifiedItemSchema'

// Mock dependencies
vi.mock('~/modules/diet/macro-target/application/macroTarget', () => ({
  getMacroTargetForDay: vi.fn(),
}))

vi.mock('~/modules/diet/meal/application/meal', () => ({
  updateMeal: vi.fn(),
}))

vi.mock('~/shared/utils/date/dateUtils', () => ({
  stringToDate: vi.fn(() => new Date('2023-01-01')),
}))

const { macroTargetUseCases } = await import(
  '~/modules/diet/macro-target/application/macroTargetUseCases'
)
const { updateMeal } = await import('~/modules/diet/meal/application/meal')

function makeTestItem(id = 1) {
  return createUnifiedItem({
    id,
    name: 'Test Item',
    quantity: 100,
    reference: {
      type: 'food' as const,
      id,
      macros: createMacroNutrients({ carbs: 10, protein: 2, fat: 1 }),
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

describe('DayEditOrchestrator', () => {
  describe('checkEditPermission', () => {
    it('should allow editing when mode is edit', () => {
      const orchestrator = createDayEditOrchestrator()
      const result = orchestrator.checkEditPermission('edit')

      expect(result.canEdit).toBe(true)
    })

    it('should deny editing when mode is summary', () => {
      const orchestrator = createDayEditOrchestrator()
      const result = orchestrator.checkEditPermission('summary')

      expect(result.canEdit).toBe(false)
      if (!result.canEdit) {
        expect(result.reason).toBe('Summary mode')
      }
    })

    it('should deny editing when mode is read-only', () => {
      const orchestrator = createDayEditOrchestrator()
      const result = orchestrator.checkEditPermission('read-only')

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
        carbs: 100,
        protein: 50,
        fat: 30,
      })
      vi.spyOn(macroTargetUseCases, 'macroTargetAt').mockReturnValue(
        mockMacroTarget,
      )

      const orchestrator = createDayEditOrchestrator()
      const dayDiet = makeTestDayDiet()
      const item = makeTestItem()

      const result = orchestrator.prepareMacroOverflowConfig(dayDiet, item)

      expect(result.enable).toBe(true)
      expect(result.originalItem).toBe(item)
    })

    it('should disable macro overflow when no macro target exists', () => {
      vi.spyOn(macroTargetUseCases, 'macroTargetAt').mockReturnValue(null)

      const orchestrator = createDayEditOrchestrator()
      const dayDiet = makeTestDayDiet()
      const item = makeTestItem()

      const result = orchestrator.prepareMacroOverflowConfig(dayDiet, item)

      expect(result.enable).toBe(false)
      expect(result.originalItem).toBeUndefined()
    })
  })

  describe('updateMealOrchestrated', () => {
    it('should call updateMeal with correct parameters', async () => {
      vi.mocked(updateMeal).mockResolvedValue(true)

      const orchestrator = createDayEditOrchestrator()
      const meal = makeTestMeal()

      await orchestrator.updateMealOrchestrated(meal)

      expect(updateMeal).toHaveBeenCalledWith(meal.id, meal)
    })

    it('should propagate errors with proper context', async () => {
      const error = new Error('Update failed')
      vi.mocked(updateMeal).mockRejectedValue(error)

      const orchestrator = createDayEditOrchestrator()
      const meal = makeTestMeal()

      await expect(orchestrator.updateMealOrchestrated(meal)).rejects.toThrow(
        'Update failed',
      )
    })
  })

  describe('addItemToMealOrchestrated', () => {
    it('should update meal with new item', async () => {
      vi.mocked(updateMeal).mockResolvedValue(true)

      const orchestrator = createDayEditOrchestrator()
      const meal = makeTestMeal()
      const newItem = makeTestItem(2)

      await orchestrator.addItemToMealOrchestrated(meal, newItem)

      expect(updateMeal).toHaveBeenCalledWith(meal.id, expect.any(Object))
    })
  })

  describe('updateItemInMealOrchestrated', () => {
    it('should update specific item in meal', async () => {
      vi.mocked(updateMeal).mockResolvedValue(true)

      const orchestrator = createDayEditOrchestrator()
      const meal = makeTestMeal()
      const originalItem = meal.items[0]!
      const updatedItem = createUnifiedItem({
        ...originalItem,
        name: 'Updated Item',
      })

      await orchestrator.updateItemInMealOrchestrated(
        meal,
        originalItem,
        updatedItem,
      )

      expect(updateMeal).toHaveBeenCalledWith(meal.id, expect.any(Object))
    })
  })
})
