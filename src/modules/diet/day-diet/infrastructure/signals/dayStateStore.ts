import { createSignal } from 'solid-js'

import { getTodayYYYYMMDD } from '~/shared/utils/date/dateUtils'

const [targetDay, setTargetDay] = createSignal<string>(getTodayYYYYMMDD())

export const dayStateStore = {
  targetDay,
  setTargetDay,
}
