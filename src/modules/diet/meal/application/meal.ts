import { updateDayDiet } from '~/modules/diet/day-diet/application/usecases/dayCrud'
import { currentDayDiet } from '~/modules/diet/day-diet/application/usecases/dayState'
import { demoteNewDayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { updateMealInDayDiet } from '~/modules/diet/day-diet/domain/dayDietOperations'
import { type Meal } from '~/modules/diet/meal/domain/meal'
import { createErrorHandler } from '~/shared/error/errorHandler'
import { withUISpan } from '~/shared/utils/tracing'

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
  return withUISpan('Meal', 'update', async (span) => {
    try {
      span.setAttributes({
        'meal.id': mealId,
        'meal.name': newMeal.name,
        'meal.items_count': newMeal.items.length,
      })

      const currentDayDiet_ = currentDayDiet()
      if (currentDayDiet_ === null) {
        span.addEvent('error', { reason: 'current_day_diet_null' })
        errorHandler.error(new Error('Current day diet is null'))
        return false
      }

      const updatedDayDiet = updateMealInDayDiet(
        currentDayDiet_,
        mealId,
        newMeal,
      )
      const newDay = demoteNewDayDiet(updatedDayDiet)
      await updateDayDiet(currentDayDiet_.id, newDay)

      span.addEvent('meal_updated', {
        'meal.id': mealId,
        'day.id': currentDayDiet_.id,
      })

      return true
    } catch (error) {
      errorHandler.error(error)
      return false
    }
  })
}
