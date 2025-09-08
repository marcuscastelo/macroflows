import { createEffect, createSignal, untrack } from 'solid-js'

import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { logging } from '~/shared/utils/logging'

const [dayDiets, setDayDiets] = createSignal<readonly DayDiet[]>([])

function clearCache() {
  logging.debug(`Clearing cache`)
  setDayDiets([])
}

function upsertToCache(dayDiet: DayDiet) {
  logging.debug(`Upserting day:`, dayDiet)
  const existingDayIndex = untrack(dayDiets).findIndex(
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

function createCacheItemSignal<T extends keyof DayDiet>(filter: {
  by: T
  value: DayDiet[T]
}) {
  logging.debug(`findInCache filter=`, filter)
  const result = dayDiets().find((d) => d[filter.by] === filter.value) ?? null
  logging.debug(`findInCache result=`, result)
  return result
}

export const dayCacheStore = {
  dayDiets,
  setDayDiets,
  clearCache,
  upsertToCache,
  removeFromCache,
  createCacheItemSignal,
}

createEffect(() => {
  logging.debug(`Cache size: `, dayDiets().length)
})
