import { createEffect, createSignal } from 'solid-js'

import { getTodayYYYYMMDD } from '~/shared/utils/date/dateUtils'
import { logging } from '~/shared/utils/logging'

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

createEffect(() => {
  logging.debug(`Today has changed: `, { currentToday: currentToday() })
})
