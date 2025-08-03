import { createEffect, createSignal } from 'solid-js'

import { dayCacheStore } from '~/modules/diet/day-diet/infrastructure/signals/dayCacheStore'
import { currentUserId } from '~/modules/user/application/user'
import { getTodayYYYYMMDD } from '~/shared/utils/date/dateUtils'

const [targetDay, setTargetDay] = createSignal<string>(getTodayYYYYMMDD())

export const dayStateStore = {
  targetDay,
  setTargetDay,
}

/**
 * When user changes, clear cache and reset to today
 */
createEffect(() => {
  const userId = currentUserId() // Create reactive dependency on user changes

  // Clear cache when user changes - lazy loading will handle refetch
  dayCacheStore.clearCache()

  // Reset target day to today for new user
  const today = getTodayYYYYMMDD()
  setTargetDay(today)

  console.log(`[dayDiet] User changed to ${userId}, reset to today: ${today}`)
})
