import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { type Item } from '~/modules/diet/item/schema/itemSchema'
import { macroTargetUseCases } from '~/modules/diet/macro-target/application/macroTargetUseCases'
import { updateMeal } from '~/modules/diet/meal/application/meal'
import { type Meal } from '~/modules/diet/meal/domain/meal'
import {
  addItemToMeal,
  updateItemInMeal,
} from '~/modules/diet/meal/domain/mealOperations'
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
  | { enable: true; originalItem: Item }

/**
 * Factory that creates the day edit orchestrator.
 *
 * Accepts the minimal set of dependencies used by the orchestration logic so
 * consumers can inject alternatives during testing or when wiring via DI.
 */
export function createDayEditOrchestrator(deps: {
  /**
   * Returns the macro target for a given date (may return null/undefined when absent)
   */
  macroTargetAt: (date: Date) => unknown
  /**
   * Persists the provided meal for the given id
   */
  updateMeal: (id: Meal['id'], meal: Meal) => Promise<unknown>
  /**
   * Pure domain operation that returns an updated meal with a new item added
   */
  addItemToMeal: (meal: Meal, item: Item) => Meal
  /**
   * Pure domain operation that returns an updated meal with an item updated
   */
  updateItemInMeal: (meal: Meal, itemId: Item['id'], item: Item) => Meal
}) {
  const {
    macroTargetAt,
    updateMeal: depsUpdateMeal,
    addItemToMeal: depsAdd,
    updateItemInMeal: depsUpdateItem,
  } = deps

  return {
    /**
     * Checks if a day can be edited based on the current mode
     */
    checkEditPermission(mode: EditMode): EditPermissionResult {
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
    },

    /**
     * Prepares macro overflow configuration for item editing
     */
    prepareMacroOverflowConfig(
      dayDiet: DayDiet,
      item: Item,
    ): MacroOverflowConfig {
      try {
        const dayDate = stringToDate(dayDiet.target_day)
        const macroTarget = macroTargetAt(dayDate)

        // Explicitly check for null/undefined to avoid using an `any`-style
        // value in a boolean conditional (satisfies linter rules).
        if (macroTarget === null || macroTarget === undefined) {
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
    },

    /**
     * Orchestrates the update of an item in a meal
     */
    async updateItemInMealOrchestrated(
      meal: Meal,
      _item: Item,
      updatedItem: Item,
    ): Promise<void> {
      try {
        const updatedMeal = depsUpdateItem(meal, updatedItem.id, updatedItem)
        await depsUpdateMeal(meal.id, updatedMeal)
      } catch (error) {
        logging.error(
          'DayEditOrchestrator updateItemInMealOrchestrated error:',
          error,
        )
        throw error
      }
    },

    /**
     * Orchestrates adding a new item to a meal
     */
    async addItemToMealOrchestrated(meal: Meal, newItem: Item): Promise<void> {
      try {
        const updatedMeal = depsAdd(meal, newItem)
        await depsUpdateMeal(meal.id, updatedMeal)
      } catch (error) {
        logging.error(
          'DayEditOrchestrator addItemToMealOrchestrated error:',
          error,
        )
        throw error
      }
    },

    /**
     * Orchestrates updating a meal
     */
    async updateMealOrchestrated(meal: Meal): Promise<void> {
      try {
        await depsUpdateMeal(meal.id, meal)
      } catch (error) {
        logging.error(
          'DayEditOrchestrator updateMealOrchestrated error:',
          error,
        )
        throw error
      }
    },
  }
}

/**
 * Backward-compatible shim kept for legacy consumers.
 * Consumers may continue to import `dayUseCases` while migration proceeds.
 */
export const dayUseCases = createDayEditOrchestrator({
  macroTargetAt: (d: Date) => macroTargetUseCases.macroTargetAt(d),
  updateMeal,
  addItemToMeal,
  updateItemInMeal,
})
