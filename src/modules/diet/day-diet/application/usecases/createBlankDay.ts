import { useCases } from '~/di/useCases'
import { type DayUseCases } from '~/modules/diet/day-diet/application/usecases/dayUseCases'
import { createNewDayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { createDefaultMeals } from '~/modules/diet/day-diet/domain/defaultMeals'
import { type User } from '~/modules/user/domain/user'

/**
 * Factory that creates the `createBlankDay` use-case.
 *
 * We accept a callable `dayUseCases` provider to avoid init-order issues
 * (so consumers can pass `() => container.dayUseCases` or a local shim).
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
 * Backward-compatible shim kept for legacy consumers.
 * Consumers may continue to import `createBlankDay` while migration proceeds.
 * TODO: Remove DI shims and use proper container/use-case injection.
 */
export const createBlankDay = createCreateBlankDay({
  dayUseCases: () => useCases.dayUseCases(),
})
