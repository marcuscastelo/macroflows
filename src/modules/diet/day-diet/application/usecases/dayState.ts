import { dayCacheStore } from '~/modules/diet/day-diet/infrastructure/signals/dayCacheStore'
import { dayChangeStore } from '~/modules/diet/day-diet/infrastructure/signals/dayChangeStore'
import { initializeDayEffects } from '~/modules/diet/day-diet/infrastructure/signals/dayEffects'
import { dayStateStore } from '~/modules/diet/day-diet/infrastructure/signals/dayStateStore'

export const targetDay = dayStateStore.targetDay
export const setTargetDay = dayStateStore.setTargetDay

export const currentToday = dayChangeStore.currentToday
export const currentDayDiet = dayCacheStore.currentDayDiet

initializeDayEffects()
