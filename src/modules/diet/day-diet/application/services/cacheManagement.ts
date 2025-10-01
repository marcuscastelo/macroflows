import { untrack } from 'solid-js'

import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { type User } from '~/modules/user/domain/user'
import { logging } from '~/shared/utils/logging'

export function createCacheManagementService(deps: {
  getExistingDays: () => readonly DayDiet[]
  getCurrentDayDiet: () => DayDiet | null
  clearCache: () => void
  fetchTargetDay: (userId: User['uuid'], targetDay: string) => void
}) {
  return ({
    currentTargetDay,
    userId,
  }: {
    currentTargetDay: string
    userId: User['uuid']
  }) => {
    logging.debug(`Effect - Refetch/Manage cache`)
    const existingDays = untrack(deps.getExistingDays)
    const currentDayDiet_ = untrack(deps.getCurrentDayDiet)

    // If any day is from other user, purge cache
    if (existingDays.find((d) => d.user_id !== userId) !== undefined) {
      logging.debug(`User changed! Purge cache`)
      deps.clearCache()
      void deps.fetchTargetDay(userId, currentTargetDay)
      return
    }

    logging.debug(
      `Target day effect - user: ${userId}, target: ${currentTargetDay}, cache size: ${existingDays.length}`,
    )
    if (currentDayDiet_ === null) {
      logging.debug(
        `No day diet found for user ${userId} on ${currentTargetDay}, fetching...`,
      )
      void deps.fetchTargetDay(userId, currentTargetDay)
    }
  }
}
