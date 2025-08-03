import { createEffect, createSignal } from 'solid-js'

import { createDebug } from '~/shared/utils/createDebug'
import { getTodayYYYYMMDD } from '~/shared/utils/date/dateUtils'

const debug = createDebug()

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
  debug(`Today has changed: `, currentToday())
})
