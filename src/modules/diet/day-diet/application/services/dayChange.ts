import { type Setter } from 'solid-js'

import { logging } from '~/shared/utils/logging'

let dayCheckInterval: NodeJS.Timeout | null = null
export function startDayChangeDetectionWorker(deps: {
  getTodayYYYYMMDD: () => string
  getPreviousToday: () => string
  getCurrentTargetDay: () => string
  setCurrentToday: Setter<string>
  setDayChangeData: Setter<{
    previousDay: string
    newDay: string
  } | null>
}) {
  // Clear any existing interval
  if (dayCheckInterval !== null) {
    clearInterval(dayCheckInterval)
  }
  dayCheckInterval = setInterval(() => {
    const newToday = deps.getTodayYYYYMMDD()
    const previousToday = deps.getPreviousToday()
    const currentTarget = deps.getCurrentTargetDay()
    if (newToday !== previousToday) {
      logging.debug(`Day changed from ${previousToday} to ${newToday}`)
      deps.setCurrentToday(newToday)
      // Only show modal if user is not already viewing today
      if (currentTarget !== newToday) {
        deps.setDayChangeData({
          previousDay: previousToday,
          newDay: newToday,
        })
      }
    }
  }, 6000)

  const cleanup = () => {
    if (dayCheckInterval !== null) {
      clearInterval(dayCheckInterval)
      dayCheckInterval = null
    }
  }

  return cleanup
}
