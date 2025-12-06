import {
  type DayUseCases,
  dayUseCases,
} from '~/modules/diet/day-diet/application/usecases/dayUseCases'
import { demoteNewDayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { updateMealInDayDiet } from '~/modules/diet/day-diet/domain/dayDietOperations'
import { type Meal } from '~/modules/diet/meal/domain/meal'
import { logging } from '~/shared/utils/logging'

/**
 * Factory that returns meal-related use-cases.
 * @param deps.dayUseCases - injected day-use-cases provider
 */
export function createMealUseCases(deps: { dayUseCases: DayUseCases }) {
  const { dayUseCases } = deps

  return {
    async updateMeal(mealId: Meal['id'], newMeal: Meal): Promise<boolean> {
      try {
        const currentDayDiet_ = dayUseCases.currentDayDiet()
        if (currentDayDiet_ === null) {
          logging.error(
            'Meal application error:',
            new Error('Current day diet is null'),
          )
          return false
        }

        const updatedDayDiet = updateMealInDayDiet(
          currentDayDiet_,
          mealId,
          newMeal,
        )
        const newDay = demoteNewDayDiet(updatedDayDiet)
        await dayUseCases.updateDayDietById(currentDayDiet_.id, newDay)

        return true
      } catch (error) {
        logging.error('Meal application error:', error)
        return false
      }
    },
  }
}

/**
 * Backward-compatible shim: keep `updateMeal` function export working.
 */
export const mealUseCases = createMealUseCases({
  dayUseCases,
})

export const updateMeal = (mealId: Meal['id'], newMeal: Meal) =>
  mealUseCases.updateMeal(mealId, newMeal)
