import { batch } from 'solid-js'

import { dayCacheStore } from '~/modules/diet/day-diet/application/store/dayCacheStore'
import { dayChangeStore } from '~/modules/diet/day-diet/application/store/dayChangeStore'
import { dayStateStore } from '~/modules/diet/day-diet/infrastructure/signals/dayStateStore'

export const dayChangeData = dayChangeStore.dayChangeData

/**
 * Dismisses the day change confirmation modal
 */
export function dismissDayChangeModal() {
  dayChangeStore.setDayChangeData(null)
}

/**
 * Accepts the day change and navigates to the new day
 */
export function acceptDayChange() {
  const changeData = dayChangeStore.dayChangeData()
  if (changeData) {
    batch(() => {
      dayCacheStore.clearCache()
      dayStateStore.setTargetDay(changeData.newDay)
      dayChangeStore.setDayChangeData(null)
    })
  }
}
