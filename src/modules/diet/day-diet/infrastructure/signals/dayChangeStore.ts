import { createEffect, createSignal, onCleanup } from 'solid-js'

import { dayStateStore } from '~/modules/diet/day-diet/infrastructure/signals/dayStateStore'
import { getTodayYYYYMMDD } from '~/shared/utils/date/dateUtils'

// Set up automatic day change detection
let dayCheckInterval: NodeJS.Timeout | null = null

/**
 * Signal that tracks when the day has changed and a confirmation modal should be shown.
 * Contains the previous day that the user was viewing when the day changed.
 */
const [dayChangeData, setDayChangeData] = createSignal<{
  previousDay: string
  newDay: string
} | null>(null)

const [currentToday, setCurrentToday] = createSignal<string>(getTodayYYYYMMDD())

export const dayChangeStore = {
  dayChangeData,
  setDayChangeData,
  currentToday,
  setCurrentToday,
}

function startDayChangeDetection() {
  // Clear any existing interval
  if (dayCheckInterval !== null) {
    clearInterval(dayCheckInterval)
  }

  dayCheckInterval = setInterval(() => {
    const newToday = getTodayYYYYMMDD()
    const previousToday = currentToday()

    if (newToday !== previousToday) {
      console.log(`[dayDiet] Day changed from ${previousToday} to ${newToday}`)
      setCurrentToday(newToday)

      // Only show modal if user is not already viewing today
      if (dayStateStore.targetDay() !== newToday) {
        setDayChangeData({
          previousDay: previousToday,
          newDay: newToday,
        })
      }
    }
  }, 6000)
}

createEffect(() => {
  startDayChangeDetection()
  onCleanup(() => {
    if (dayCheckInterval !== null) {
      clearInterval(dayCheckInterval)
      dayCheckInterval = null
    }
  })
})
