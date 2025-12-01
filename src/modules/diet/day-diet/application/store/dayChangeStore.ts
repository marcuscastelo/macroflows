import { createEffect, createSignal } from 'solid-js'

import { getTodayYYYYMMDD } from '~/shared/utils/date/dateUtils'
import { logging } from '~/shared/utils/logging'

export function createDayChangeStore() {
  const [dayChangeData, setDayChangeData] = createSignal<{
    previousDay: string
    newDay: string
  } | null>(null)

  const [currentToday, setCurrentToday] =
    createSignal<string>(getTodayYYYYMMDD())

  createEffect(() => {
    logging.debug(`Today has changed: `, { currentToday: currentToday() })
  })

  return {
    dayChangeData,
    setDayChangeData,
    currentToday,
    setCurrentToday,
  }
}
