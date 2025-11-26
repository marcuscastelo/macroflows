import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { macroTargetUseCases } from '~/modules/diet/macro-target/application/macroTargetUseCases'
import { updateMeal } from '~/modules/diet/meal/application/meal'
import { type Meal } from '~/modules/diet/meal/domain/meal'
import {
  addItemToMeal,
  updateItemInMeal,
} from '~/modules/diet/meal/domain/mealOperations'
import { type UnifiedItem } from '~/modules/diet/unified-item/schema/unifiedItemSchema'
import { stringToDate } from '~/shared/utils/date/dateUtils'
import { logging } from '~/shared/utils/logging'

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
      const macroTarget = macroTargetUseCases.macroTargetAt(dayDate)

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
      logging.error(
        'DayEditOrchestrator prepareMacroOverflowConfig error:',
        error,
      )

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
    _item: UnifiedItem,
    updatedItem: UnifiedItem,
  ): Promise<void> {
    try {
      const updatedMeal = updateItemInMeal(meal, updatedItem.id, updatedItem)
      await updateMeal(meal.id, updatedMeal)
    } catch (error) {
      logging.error(
        'DayEditOrchestrator updateItemInMealOrchestrated error:',
        error,
      )
      throw error
    }
  }

  /**
   * Orchestrates adding a new item to a meal
   */
  async function addItemToMealOrchestrated(
    meal: Meal,
    newItem: UnifiedItem,
  ): Promise<void> {
    try {
      const updatedMeal = addItemToMeal(meal, newItem)
      await updateMeal(meal.id, updatedMeal)
    } catch (error) {
      logging.error(
        'DayEditOrchestrator addItemToMealOrchestrated error:',
        error,
      )
      throw error
    }
  }

  /**
   * Orchestrates updating a meal
   */
  async function updateMealOrchestrated(meal: Meal): Promise<void> {
    try {
      await updateMeal(meal.id, meal)
    } catch (error) {
      logging.error('DayEditOrchestrator updateMealOrchestrated error:', error)
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
