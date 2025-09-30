import { insertDayDiet } from '~/modules/diet/day-diet/application/usecases/dayCrud'
import { createNewDayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { createDefaultMeals } from '~/modules/diet/day-diet/domain/defaultMeals'
import { type User } from '~/modules/user/domain/user'

/**
 * Creates a blank day diet with default meals for the specified user and date
 * @param userId - The ID of the user creating the day
 * @param targetDay - The target date in YYYY-MM-DD format
 * @returns Promise that resolves when the day is created
 */
export async function createBlankDay(
  userId: User['uuid'],
  targetDay: string,
): Promise<void> {
  const newDayDiet = createNewDayDiet({
    user_id: userId,
    target_day: targetDay,
    meals: createDefaultMeals(),
  })

  await insertDayDiet(newDayDiet)
}
