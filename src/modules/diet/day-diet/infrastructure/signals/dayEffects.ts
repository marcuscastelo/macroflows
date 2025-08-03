import { createEffect, createRoot, onCleanup, onMount, untrack } from 'solid-js'

import { fetchCurrentDayDiet } from '~/modules/diet/day-diet/application/usecases/dayCrud'
import { currentDayDiet } from '~/modules/diet/day-diet/application/usecases/dayState'
import { dayCacheStore } from '~/modules/diet/day-diet/infrastructure/signals/dayCacheStore'
import { dayChangeStore } from '~/modules/diet/day-diet/infrastructure/signals/dayChangeStore'
import { dayStateStore } from '~/modules/diet/day-diet/infrastructure/signals/dayStateStore'
import { currentUserId } from '~/modules/user/application/user'
import { createDebug } from '~/shared/utils/createDebug'
import { getTodayYYYYMMDD } from '~/shared/utils/date/dateUtils'

const debug = createDebug()

let initialized = false
export function initializeDayEffects() {
  if (initialized) {
    return
  }
  initialized = true
  return createRoot(() => {
    // /**
    //  * When user changes, clear cache and reset to today
    //  */
    createEffect(() => {
      debug(`Effect - Reset to today!`)
      const userId = currentUserId() // Create reactive dependency on user changes
      // Reset target day to today for new user
      const today = getTodayYYYYMMDD()
      dayStateStore.setTargetDay(today)
      debug(`User changed to ${userId}, reset to today: ${today}`)
    })

    // Set up automatic day change detection
    let dayCheckInterval: NodeJS.Timeout | null = null
    onMount(() => {
      // Clear any existing interval
      if (dayCheckInterval !== null) {
        clearInterval(dayCheckInterval)
      }
      dayCheckInterval = setInterval(() => {
        const newToday = getTodayYYYYMMDD()
        const previousToday = untrack(dayChangeStore.currentToday)
        const currentTarget = untrack(dayStateStore.targetDay)
        if (newToday !== previousToday) {
          debug(`Day changed from ${previousToday} to ${newToday}`)
          dayChangeStore.setCurrentToday(newToday)
          // Only show modal if user is not already viewing today
          if (currentTarget !== newToday) {
            dayChangeStore.setDayChangeData({
              previousDay: previousToday,
              newDay: newToday,
            })
          }
        }
      }, 6000)

      onCleanup(() => {
        if (dayCheckInterval !== null) {
          clearInterval(dayCheckInterval)
          dayCheckInterval = null
        }
      })
    })

    createEffect(() => {
      debug(`Effect - Refetch/Manage cache`)
      const currentTarget = dayStateStore.targetDay()
      const userId = currentUserId()
      const existingDays = untrack(dayCacheStore.dayDiets)
      const currentDayDiet_ = untrack(currentDayDiet)

      // If any day is from other user, purge cache
      if (existingDays.find((d) => d.owner !== userId) !== undefined) {
        debug(`User changed! Purge cache`)
        dayCacheStore.clearCache()
        void fetchCurrentDayDiet(userId, currentTarget)
        return
      }

      debug(
        `Target day effect - user: ${userId}, target: ${currentTarget}, cache size: ${existingDays.length}`,
      )
      if (currentDayDiet_ === null) {
        debug(
          `No day diet found for user ${userId} on ${currentTarget}, fetching...`,
        )
        void fetchCurrentDayDiet(userId, currentTarget)
      }
    })
  })
}
