import { createEffect, createSignal } from 'solid-js'

import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { dayStateStore } from '~/modules/diet/day-diet/infrastructure/signals/dayStateStore'
import { createDebug } from '~/shared/utils/createDebug'

const debug = createDebug()

const [dayDiets, setDayDiets] = createSignal<readonly DayDiet[]>([])
const currentDayDiet = () =>
  dayDiets().find((d) => d.target_day === dayStateStore.targetDay()) ?? null

function clearCache() {
  setDayDiets([])
}

function upsertToCache(dayDiet: DayDiet) {
  const existingDayIndex = dayDiets().findIndex(
    (d) => d.target_day === dayDiet.target_day,
  )
  setDayDiets((existingDays) => {
    const days = [...existingDays]
    if (existingDayIndex >= 0) {
      days[existingDayIndex] = dayDiet
    } else {
      days.push(dayDiet)
      days.sort((a, b) => a.target_day.localeCompare(b.target_day))
    }
    return days
  })
}

function removeFromCache<T extends keyof DayDiet>(filter: {
  by: T
  value: DayDiet[T]
}) {
  setDayDiets((days) => days.filter((d) => d[filter.by] !== filter.value))
}

export const dayCacheStore = {
  currentDayDiet,
  dayDiets,
  setDayDiets,
  clearCache,
  upsertToCache,
  removeFromCache,
}

createEffect(() => {
  debug(`Cache size: `, dayDiets().length)
})
