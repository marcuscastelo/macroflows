import {
  type Accessor,
  batch,
  createEffect,
  createRoot,
  onCleanup,
  onMount,
  untrack,
} from 'solid-js'

import { startDayChangeDetectionWorker } from '~/modules/diet/day-diet/application/services/dayChange'
import { dayCacheStore } from '~/modules/diet/day-diet/application/store/dayCacheStore'
import { createDayChangeStore } from '~/modules/diet/day-diet/application/store/dayChangeStore'
import { createDayStateStore } from '~/modules/diet/day-diet/application/store/dayStateStore'
import { fetchTargetDay } from '~/modules/diet/day-diet/application/usecases/dayCrud'
import { initializeDayDietRealtime } from '~/modules/diet/day-diet/infrastructure/supabase/realtime'
import { currentUserId } from '~/modules/user/application/user'
import { type User } from '~/modules/user/domain/user'
import { getTodayYYYYMMDD } from '~/shared/utils/date/dateUtils'
import { logging } from '~/shared/utils/logging'

const runCacheManagement = ({
  currentTargetDay,
  userId,
  currentDayDiet,
}: {
  currentTargetDay: string
  userId: User['uuid']
  currentDayDiet: Accessor<ReturnType<
    typeof dayCacheStore.createCacheItemSignal
  > | null>
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

export const dayUseCases = createRoot(() => {
  const dayChangeStore = createDayChangeStore()
  const dayStateStore = createDayStateStore()

  const runTargetDayReset = () => {
    logging.debug(`Effect - Reset to today!`)
    const today = getTodayYYYYMMDD()
    dayStateStore.setTargetDay(today)
  }

  initializeDayDietRealtime()

  onMount(() => {
    const cleanup = startDayChangeDetectionWorker({
      getTodayYYYYMMDD,
      getPreviousToday: () => untrack(dayChangeStore.currentToday),
      getCurrentTargetDay: () => untrack(dayStateStore.targetDay),
      setCurrentToday: dayChangeStore.setCurrentToday,
      setDayChangeData: dayChangeStore.setDayChangeData,
    })

    onCleanup(cleanup)
  })

  createEffect(() => {
    const userId = currentUserId()
    const currentTargetDay = dayStateStore.targetDay()

    runCacheManagement({
      userId,
      currentTargetDay,
      currentDayDiet: obj.currentDayDiet,
    })
  })

  createEffect(() => {
    const userId = currentUserId()
    logging.debug(`User changed to ${userId}, resetting target day`)
    runTargetDayReset()
  })

  const obj = {
    currentToday: dayChangeStore.currentToday,
    dayChangeData: dayChangeStore.dayChangeData,
    dismissDayChangeModal: () => dayChangeStore.setDayChangeData(null),
    acceptDayChange: () => {
      const changeData = dayChangeStore.dayChangeData()
      if (changeData) {
        batch(() => {
          dayCacheStore.clearCache()
          dayStateStore.setTargetDay(changeData.newDay)
          dayChangeStore.setDayChangeData(null)
        })
      }
    },
    targetDay: dayStateStore.targetDay,
    setTargetDay: dayStateStore.setTargetDay,
    currentDayDiet: () =>
      dayCacheStore.createCacheItemSignal({
        by: 'target_day',
        value: dayStateStore.targetDay(),
      }),
  }

  createEffect(() => {
    logging.debug(`CurrentDayDiet:`, { currentDayDiet: obj.currentDayDiet() })
  })

  return obj
})
