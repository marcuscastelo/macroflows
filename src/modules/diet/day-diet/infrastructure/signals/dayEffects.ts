import { createEffect, createRoot, onCleanup, onMount, untrack } from 'solid-js'

import { createCacheManagementService } from '~/modules/diet/day-diet/application/services/cacheManagement'
import { startDayChangeDetectionWorker } from '~/modules/diet/day-diet/application/services/dayChange'
import { createTargetDayResetService } from '~/modules/diet/day-diet/application/services/targetDayReset'
import { fetchTargetDay } from '~/modules/diet/day-diet/application/usecases/dayCrud'
import {
  currentDayDiet,
  targetDay,
} from '~/modules/diet/day-diet/application/usecases/dayState'
import { dayCacheStore } from '~/modules/diet/day-diet/infrastructure/signals/dayCacheStore'
import { dayChangeStore } from '~/modules/diet/day-diet/infrastructure/signals/dayChangeStore'
import { dayStateStore } from '~/modules/diet/day-diet/infrastructure/signals/dayStateStore'
import { currentUserId } from '~/modules/user/application/user'
import { createDebug } from '~/shared/utils/createDebug'
import { getTodayYYYYMMDD } from '~/shared/utils/date/dateUtils'

const runTargetDayReset = createTargetDayResetService({
  getTodayYYYYMMDD,
  setTargetDay: dayStateStore.setTargetDay,
})

const runCacheManagement = createCacheManagementService({
  getExistingDays: () => untrack(dayCacheStore.dayDiets),
  getCurrentDayDiet: () => untrack(currentDayDiet),
  clearCache: dayCacheStore.clearCache,
  fetchTargetDay: (userId, targetDay) => void fetchTargetDay(userId, targetDay),
})

const debug = createDebug()

let initialized = false
export function initializeDayEffects() {
  if (initialized) {
    return
  }
  initialized = true
  return createRoot(() => {
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
      debug(`User changed to ${userId}, resetting target day`)
      runTargetDayReset()
    })

    createEffect(() => {
      const userId = currentUserId()
      const currentTargetDay = targetDay()
      runCacheManagement({ userId, currentTargetDay })
    })
  })
}
