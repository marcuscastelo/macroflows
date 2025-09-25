import { updateDayDiet } from '~/modules/diet/day-diet/application/usecases/dayCrud'
import { currentDayDiet } from '~/modules/diet/day-diet/application/usecases/dayState'
import { demoteNewDayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { updateMealInDayDiet } from '~/modules/diet/day-diet/domain/dayDietOperations'
import { type Meal } from '~/modules/diet/meal/domain/meal'
import { logging } from '~/shared/utils/logging'

/**
 * Updates a meal in the current day diet.
 * @param mealId - The meal ID.
 * @param newMeal - The new meal data.
 * @returns True if updated, false otherwise.
 */

export async function updateMeal(
  mealId: Meal['id'],
  newMeal: Meal,
): Promise<boolean> {
  try {
    const currentDayDiet_ = currentDayDiet()
    if (currentDayDiet_ === null) {
      logging.error(
        'Meal application error:',
        new Error('Current day diet is null'),
      )
      return false
    }

    const updatedDayDiet = updateMealInDayDiet(currentDayDiet_, mealId, newMeal)
    const newDay = demoteNewDayDiet(updatedDayDiet)
    await updateDayDiet(currentDayDiet_.id, newDay)

    return true
  } catch (error) {
    logging.error('Meal application error:', error)
    return false
  }
}
