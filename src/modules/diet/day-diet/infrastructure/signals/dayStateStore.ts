import { createEffect, createSignal } from 'solid-js'

import { getTodayYYYYMMDD } from '~/shared/utils/date/dateUtils'
import { logging } from '~/shared/utils/logging'

const [targetDay, setTargetDay] = createSignal<string>(getTodayYYYYMMDD())

export const dayStateStore = {
  targetDay,
  setTargetDay,
}

createEffect(() => {
  logging.debug(`TargetDay =`, { targetDay: targetDay() })
})
