import { createEffect, createSignal, onCleanup } from 'solid-js'

import { fetchCurrentDayDiet } from '~/modules/diet/day-diet/application/usecases/dayCrud'
import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { currentUserId } from '~/modules/user/application/user'
import { getTodayYYYYMMDD } from '~/shared/utils/date/dateUtils'

const [targetDay, setTargetDay] = createSignal<string>(getTodayYYYYMMDD())

const [dayDiets, setDayDiets] = createSignal<readonly DayDiet[]>([])
const [currentDayDiet, setCurrentDayDiet] = createSignal<DayDiet | null>(null)

/**
 * Reactive signal that tracks the current day and automatically updates when the day changes.
 * This is used for day lock functionality to ensure proper edit mode restrictions.
 */
const [currentToday, setCurrentToday] = createSignal<string>(getTodayYYYYMMDD())

/**
 * Signal that tracks when the day has changed and a confirmation modal should be shown.
 * Contains the previous day that the user was viewing when the day changed.
 */
const [dayChangeData, setDayChangeData] = createSignal<{
  previousDay: string
  newDay: string
} | null>(null)

export const dayDietStore = {
  dayDiets,
  setDayDiets,
  targetDay,
  setTargetDay,
  currentDayDiet,
  setCurrentDayDiet,
  currentToday,
  setCurrentToday,
  dayChangeData,
  setDayChangeData,
}

// Set up automatic day change detection
let dayCheckInterval: NodeJS.Timeout | null = null

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
      if (targetDay() !== newToday) {
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

/**
 * When user changes, clear cache and reset to today
 */
createEffect(() => {
  const userId = currentUserId() // Create reactive dependency on user changes

  // Clear cache when user changes - lazy loading will handle refetch
  setDayDiets([])
  setCurrentDayDiet(null)

  // Reset target day to today for new user
  const today = getTodayYYYYMMDD()
  setTargetDay(today)

  console.log(`[dayDiet] User changed to ${userId}, reset to today: ${today}`)
})

/**
 * When target day changes, update current day diet
 * Optimized: Fetches specific day if not in cache
 */
createEffect(() => {
  const userId = currentUserId()
  const currentTarget = targetDay()
  const existingDays = dayDiets()

  console.log(
    `[dayDiet] Target day effect - user: ${userId}, target: ${currentTarget}, cache size: ${existingDays.length}`,
  )

  const dayDiet = existingDays.find(
    (dayDiet) => dayDiet.target_day === currentTarget,
  )

  if (dayDiet === undefined) {
    console.warn(
      `[dayDiet] No day diet found for user ${userId} on ${currentTarget}, fetching...`,
    )
    setCurrentDayDiet(null)

    if (userId) {
      // Optimized: Fetch only the specific day we need
      void fetchCurrentDayDiet(userId, currentTarget, existingDays)
    }
    return
  }

  setCurrentDayDiet(dayDiet)
})
