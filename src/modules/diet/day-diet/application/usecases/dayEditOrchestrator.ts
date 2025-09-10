import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { getMacroTargetForDay } from '~/modules/diet/macro-target/application/macroTarget'
import { updateMeal } from '~/modules/diet/meal/application/meal'
import { type Meal } from '~/modules/diet/meal/domain/meal'
import {
  addItemToMeal,
  updateItemInMeal,
} from '~/modules/diet/meal/domain/mealOperations'
import { type UnifiedItem } from '~/modules/diet/unified-item/schema/unifiedItemSchema'
import { createErrorHandler } from '~/shared/error/errorHandler'
import { trackMealItemAddition, trackMealItemEdit } from '~/shared/performance'
import { stringToDate } from '~/shared/utils/date/dateUtils'

const errorHandler = createErrorHandler('application', 'DayEditOrchestrator')

export type EditMode = 'edit' | 'read-only' | 'summary'

export type EditPermissionResult =
  | { canEdit: true }
  | {
      canEdit: false
      reason: string
      title: string
      confirmText: string
      cancelText: string
    }

export type MacroOverflowConfig =
  | { enable: false; originalItem: undefined }
  | { enable: true; originalItem: UnifiedItem }

/**
 * Orchestrates day editing operations, handling permissions, validations, and business logic
 */
export function createDayEditOrchestrator() {
  /**
   * Checks if a day can be edited based on the current mode
   */
  function checkEditPermission(mode: EditMode): EditPermissionResult {
    if (mode === 'summary') {
      return {
        canEdit: false,
        reason: 'Summary mode',
        title: 'Modo resumo',
        confirmText: 'OK',
        cancelText: '',
      }
    }

    if (mode !== 'edit') {
      return {
        canEdit: false,
        reason: 'Day not editable',
        title: 'Dia não editável',
        confirmText: 'Desbloquear',
        cancelText: 'Cancelar',
      }
    }

    return { canEdit: true }
  }

  /**
   * Prepares macro overflow configuration for item editing
   */
  function prepareMacroOverflowConfig(
    dayDiet: DayDiet,
    item: UnifiedItem,
  ): MacroOverflowConfig {
    try {
      const dayDate = stringToDate(dayDiet.target_day)
      const macroTarget = getMacroTargetForDay(dayDate)

      if (!macroTarget) {
        return {
          enable: false,
          originalItem: undefined,
        }
      }

      return {
        enable: true,
        originalItem: item,
      }
    } catch (error) {
      errorHandler.apiError(error, {
        component: 'DayEditOrchestrator',
        operation: 'prepareMacroOverflowConfig',
        additionalData: { dayDiet: dayDiet.id, itemId: item.id },
      })

      return {
        enable: false,
        originalItem: undefined,
      }
    }
  }

  /**
   * Orchestrates the update of an item in a meal
   */
  async function updateItemInMealOrchestrated(
    meal: Meal,
    item: UnifiedItem,
    updatedItem: UnifiedItem,
    userId?: string,
  ): Promise<void> {
    if (userId !== undefined && userId !== '') {
      await trackMealItemEdit(
        userId,
        String(item.id),
        updatedItem,
        async () => {
          const updatedMeal = updateItemInMeal(
            meal,
            updatedItem.id,
            updatedItem,
          )
          await updateMeal(meal.id, updatedMeal)
        },
      )
    } else {
      try {
        const updatedMeal = updateItemInMeal(meal, updatedItem.id, updatedItem)
        await updateMeal(meal.id, updatedMeal)
      } catch (error) {
        errorHandler.apiError(error, {
          component: 'DayEditOrchestrator',
          operation: 'updateItemInMealOrchestrated',
          additionalData: { mealId: meal.id, itemId: item.id },
        })
        throw error
      }
    }
  }

  /**
   * Orchestrates adding a new item to a meal
   */
  async function addItemToMealOrchestrated(
    meal: Meal,
    newItem: UnifiedItem,
    userId?: string,
  ): Promise<void> {
    if (userId !== undefined && userId !== '') {
      await trackMealItemAddition(
        userId,
        String(meal.id),
        newItem,
        async () => {
          const updatedMeal = addItemToMeal(meal, newItem)
          await updateMeal(meal.id, updatedMeal)
        },
      )
    } else {
      try {
        const updatedMeal = addItemToMeal(meal, newItem)
        await updateMeal(meal.id, updatedMeal)
      } catch (error) {
        errorHandler.apiError(error, {
          component: 'DayEditOrchestrator',
          operation: 'addItemToMealOrchestrated',
          additionalData: { mealId: meal.id, newItemId: newItem.id },
        })
        throw error
      }
    }
  }

  /**
   * Orchestrates updating a meal
   */
  async function updateMealOrchestrated(meal: Meal): Promise<void> {
    try {
      await updateMeal(meal.id, meal)
    } catch (error) {
      errorHandler.apiError(error, {
        component: 'DayEditOrchestrator',
        operation: 'updateMealOrchestrated',
        additionalData: { mealId: meal.id },
      })
      throw error
    }
  }

  return {
    checkEditPermission,
    prepareMacroOverflowConfig,
    updateItemInMealOrchestrated,
    addItemToMealOrchestrated,
    updateMealOrchestrated,
  }
}
