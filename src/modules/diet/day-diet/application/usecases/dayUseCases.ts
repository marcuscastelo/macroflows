import { batch, createRoot, onCleanup, onMount, untrack } from 'solid-js'

import { startDayChangeDetectionWorker } from '~/modules/diet/day-diet/application/services/dayChange'
import { dayCacheStore } from '~/modules/diet/day-diet/application/store/dayCacheStore'
import { createDayChangeStore } from '~/modules/diet/day-diet/application/store/dayChangeStore'
import { dayStateStore } from '~/modules/diet/day-diet/infrastructure/signals/dayStateStore'
import { getTodayYYYYMMDD } from '~/shared/utils/date/dateUtils'

export const dayUseCases = createRoot(() => {
  const dayChangeStore = createDayChangeStore()

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

  return {
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
  }
})
