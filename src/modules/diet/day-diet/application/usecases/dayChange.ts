import { dayDietStore } from '~/modules/diet/day-diet/application/dayDietStore'

export const dayChangeData = dayDietStore.dayChangeData

/**
 * Dismisses the day change confirmation modal
 */
export function dismissDayChangeModal() {
  dayDietStore.setDayChangeData(null)
}

/**
 * Accepts the day change and navigates to the new day
 */
export function acceptDayChange() {
  const changeData = dayDietStore.dayChangeData()
  if (changeData) {
    dayDietStore.setDayDiets([])
    dayDietStore.setTargetDay(changeData.newDay)
    dayDietStore.setDayChangeData(null)
  }
}
