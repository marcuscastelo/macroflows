import { updateDayDiet } from '~/modules/diet/day-diet/application/usecases/dayCrud'
import { currentDayDiet } from '~/modules/diet/day-diet/application/usecases/dayState'
import { demoteNewDayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { updateMealInDayDiet } from '~/modules/diet/day-diet/domain/dayDietOperations'
import { type Meal } from '~/modules/diet/meal/domain/meal'
import { createErrorHandler } from '~/shared/error/errorHandler'

/**
 * Updates a meal in the current day diet.
 * @param mealId - The meal ID.
 * @param newMeal - The new meal data.
 * @returns True if updated, false otherwise.
 */
const errorHandler = createErrorHandler('application', 'Meal')

export async function updateMeal(
  mealId: Meal['id'],
  newMeal: Meal,
): Promise<boolean> {
  try {
    const currentDayDiet_ = currentDayDiet()
    if (currentDayDiet_ === null) {
      errorHandler.error(new Error('Current day diet is null'))
      return false
    }
    const updatedDayDiet = updateMealInDayDiet(currentDayDiet_, mealId, newMeal)
    const newDay = demoteNewDayDiet(updatedDayDiet)
    await updateDayDiet(currentDayDiet_.id, newDay)
    return true
  } catch (error) {
    errorHandler.error(error)
    return false
  }
}
