import { createEffect, createRoot, onCleanup, onMount, untrack } from 'solid-js'

import { fetchCurrentDayDiet } from '~/modules/diet/day-diet/application/usecases/dayCrud'
import {
  setTargetDay,
  targetDay,
} from '~/modules/diet/day-diet/application/usecases/dayState'
import { dayCacheStore } from '~/modules/diet/day-diet/infrastructure/signals/dayCacheStore'
import { dayChangeStore } from '~/modules/diet/day-diet/infrastructure/signals/dayChangeStore'
import { dayStateStore } from '~/modules/diet/day-diet/infrastructure/signals/dayStateStore'
import { currentUserId } from '~/modules/user/application/user'
import { getTodayYYYYMMDD } from '~/shared/utils/date/dateUtils'

export function initializeDayEffects() {
  return createRoot(() => {
    // /**
    //  * When user changes, clear cache and reset to today
    //  */
    createEffect(() => {
      const userId = currentUserId() // Create reactive dependency on user changes
      // Clear cache when user changes - lazy loading will handle refetch
      dayCacheStore.clearCache()
      // Reset target day to today for new user
      const today = getTodayYYYYMMDD()
      setTargetDay(today)
      console.log(
        `[dayDiet] User changed to ${userId}, reset to today: ${today}`,
      )
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
        const currentTarget = untrack(targetDay)
        if (newToday !== previousToday) {
          console.log(
            `[dayDiet] Day changed from ${previousToday} to ${newToday}`,
          )
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
      // Trigger: targetDayChanged
      const currentTarget = dayStateStore.targetDay()

      const userId = untrack(currentUserId)
      const existingDays = untrack(dayCacheStore.dayDiets)
      const currentDayDiet = untrack(dayCacheStore.currentDayDiet)
      console.log(
        `[dayDiet] Target day effect - user: ${userId}, target: ${currentTarget}, cache size: ${existingDays.length}`,
      )
      if (currentDayDiet === null) {
        console.warn(
          `[dayDiet] No day diet found for user ${userId} on ${currentTarget}, fetching...`,
        )
        void fetchCurrentDayDiet(userId, currentTarget)
      }
    })
  })
}
