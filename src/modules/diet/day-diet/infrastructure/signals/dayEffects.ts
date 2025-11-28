import { createEffect, createRoot, untrack } from 'solid-js'

import { dayCacheStore } from '~/modules/diet/day-diet/application/store/dayCacheStore'
import { fetchTargetDay } from '~/modules/diet/day-diet/application/usecases/dayCrud'
import {
  currentDayDiet,
  targetDay,
} from '~/modules/diet/day-diet/application/usecases/dayState'
import { dayStateStore } from '~/modules/diet/day-diet/infrastructure/signals/dayStateStore'
import { currentUserId } from '~/modules/user/application/user'
import { type User } from '~/modules/user/domain/user'
import { getTodayYYYYMMDD } from '~/shared/utils/date/dateUtils'
import { logging } from '~/shared/utils/logging'

const runTargetDayReset = () => {
  logging.debug(`Effect - Reset to today!`)
  const today = getTodayYYYYMMDD()
  dayStateStore.setTargetDay(today)
}

const runCacheManagement = ({
  currentTargetDay,
  userId,
}: {
  currentTargetDay: string
  userId: User['uuid']
}) => {
  logging.debug(`Effect - Refetch/Manage cache`)
  const existingDays = untrack(() => untrack(dayCacheStore.dayDiets))
  const currentDayDiet_ = untrack(() => untrack(currentDayDiet))

  // If any day is from other user, purge cache
  if (existingDays.find((d) => d.user_id !== userId) !== undefined) {
    logging.debug(`User changed! Purge cache`)
    dayCacheStore.clearCache()
    void fetchTargetDay(userId, currentTargetDay)
    return
  }

  logging.debug(
    `Target day effect - user: ${userId}, target: ${currentTargetDay}, cache size: ${existingDays.length}`,
  )
  if (currentDayDiet_ === null) {
    logging.debug(
      `No day diet found for user ${userId} on ${currentTargetDay}, fetching...`,
    )
    void fetchTargetDay(userId, currentTargetDay)
  }
}

let initialized = false
export function initializeDayEffects() {
  if (initialized) {
    return
  }
  initialized = true
  return createRoot(() => {
    createEffect(() => {
      const userId = currentUserId()
      logging.debug(`User changed to ${userId}, resetting target day`)
      runTargetDayReset()
    })

    createEffect(() => {
      const userId = currentUserId()
      const currentTargetDay = targetDay()

      runCacheManagement({ userId, currentTargetDay })
    })
  })
}
