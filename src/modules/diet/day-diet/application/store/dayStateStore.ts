import { createEffect, createSignal } from 'solid-js'

import { getTodayYYYYMMDD } from '~/shared/utils/date/dateUtils'
import { logging } from '~/shared/utils/logging'

export function createDayStateStore() {
  const [targetDay, setTargetDay] = createSignal<string>(getTodayYYYYMMDD())

  createEffect(() => {
    logging.debug(`TargetDay =`, { targetDay: targetDay() })
  })

  return {
    targetDay,
    setTargetDay,
  }
}
