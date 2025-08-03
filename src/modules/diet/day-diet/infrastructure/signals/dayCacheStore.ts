import { createEffect, createSignal } from 'solid-js'

import { fetchCurrentDayDiet } from '~/modules/diet/day-diet/application/usecases/dayCrud'
import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { dayStateStore } from '~/modules/diet/day-diet/infrastructure/signals/dayStateStore'
import { currentUserId } from '~/modules/user/application/user'

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

/**
 * When target day changes, update current day diet
 * Optimized: Fetches specific day if not in cache
 */
createEffect(() => {
  const userId = currentUserId()
  const currentTarget = dayStateStore.targetDay()
  const existingDays = dayDiets()

  console.log(
    `[dayDiet] Target day effect - user: ${userId}, target: ${currentTarget}, cache size: ${existingDays.length}`,
  )

  if (currentDayDiet() === null) {
    console.warn(
      `[dayDiet] No day diet found for user ${userId} on ${currentTarget}, fetching...`,
    )

    void fetchCurrentDayDiet(userId, currentTarget)
  }
})
