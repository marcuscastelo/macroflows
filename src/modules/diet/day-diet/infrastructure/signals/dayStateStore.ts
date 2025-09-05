import { createEffect, createSignal } from 'solid-js'

import { createDebug } from '~/shared/utils/createDebug'
import { getTodayYYYYMMDD } from '~/shared/utils/date/dateUtils'

const debug = createDebug()

const [targetDay, setTargetDay] = createSignal<string>(getTodayYYYYMMDD())

export const dayStateStore = {
  targetDay,
  setTargetDay,
}

createEffect(() => {
  debug(`TargetDay =`, targetDay())
})
