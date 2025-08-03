import { untrack } from 'solid-js'

import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { createDebug } from '~/shared/utils/createDebug'

const debug = createDebug()

export function createCacheManagementService(deps: {
  getExistingDays: () => readonly DayDiet[]
  getCurrentDayDiet: () => DayDiet | null
  clearCache: () => void
  fetchTargetDay: (userId: number, targetDay: string) => void
}) {
  return ({
    currentTargetDay,
    userId,
  }: {
    currentTargetDay: string
    userId: number
  }) => {
    debug(`Effect - Refetch/Manage cache`)
    const existingDays = untrack(deps.getExistingDays)
    const currentDayDiet_ = untrack(deps.getCurrentDayDiet)

    // If any day is from other user, purge cache
    if (existingDays.find((d) => d.owner !== userId) !== undefined) {
      debug(`User changed! Purge cache`)
      deps.clearCache()
      void deps.fetchTargetDay(userId, currentTargetDay)
      return
    }

    debug(
      `Target day effect - user: ${userId}, target: ${currentTargetDay}, cache size: ${existingDays.length}`,
    )
    if (currentDayDiet_ === null) {
      debug(
        `No day diet found for user ${userId} on ${currentTargetDay}, fetching...`,
      )
      void deps.fetchTargetDay(userId, currentTargetDay)
    }
  }
}
