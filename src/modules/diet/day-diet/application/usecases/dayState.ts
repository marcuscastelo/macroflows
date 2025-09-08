import { createEffect } from 'solid-js'

import { dayCacheStore } from '~/modules/diet/day-diet/infrastructure/signals/dayCacheStore'
import { dayChangeStore } from '~/modules/diet/day-diet/infrastructure/signals/dayChangeStore'
import { initializeDayEffects } from '~/modules/diet/day-diet/infrastructure/signals/dayEffects'
import { dayStateStore } from '~/modules/diet/day-diet/infrastructure/signals/dayStateStore'
import { initializeDayDietRealtime } from '~/modules/diet/day-diet/infrastructure/supabase/realtime'
import { logging } from '~/shared/utils/logging'

export const targetDay = dayStateStore.targetDay
export const setTargetDay = dayStateStore.setTargetDay

export const currentToday = dayChangeStore.currentToday
export const currentDayDiet = () =>
  dayCacheStore.createCacheItemSignal({ by: 'target_day', value: targetDay() })

createEffect(() => {
  logging.debug(`CurrentDayDiet:`, currentDayDiet())
})

initializeDayEffects()
initializeDayDietRealtime()
