import { type DayUseCases } from '~/modules/diet/day-diet/application/usecases/dayUseCases'
import { createNewDayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { createDefaultMeals } from '~/modules/diet/day-diet/domain/defaultMeals'
import { type User } from '~/modules/user/domain/user'

/**
 * Factory that creates the `createBlankDay` use-case.
 *
 * We accept a callable `dayUseCases` provider to avoid init-order issues
 * (for example, `() => container.dayUseCases()`).
 *
 * @param deps.dayUseCases - provider for DayUseCases
 */
export function createCreateBlankDay(deps: { dayUseCases: () => DayUseCases }) {
  const { dayUseCases: getDayUseCases } = deps

  return async function createBlankDay(
    userId: User['uuid'],
    targetDay: string,
  ): Promise<void> {
    const newDayDiet = createNewDayDiet({
      user_id: userId,
      target_day: targetDay,
      meals: createDefaultMeals(),
    })

    await getDayUseCases().insertDayDiet(newDayDiet)
  }
}

/**
 * Shim removed: consumers must now use the factory `createCreateBlankDay`.
 *
 * Example usage:
 *   const createBlankDay = createCreateBlankDay({
 *     dayUseCases: () => container.dayUseCases(),
 *   })
 *
 * This file exposes the factory `createCreateBlankDay`. Update any consumers
 * that previously imported `createBlankDay` to call the factory (or obtain
 * the instance from the DI container) before removing this comment.
 */
