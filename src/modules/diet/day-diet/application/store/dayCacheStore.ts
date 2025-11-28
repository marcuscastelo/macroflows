import { type Accessor, createEffect, createSignal, untrack } from 'solid-js'

import { fetchTargetDay } from '~/modules/diet/day-diet/application/usecases/dayCrud'
import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { type User } from '~/modules/user/domain/user'
import { logging } from '~/shared/utils/logging'

export function createDayCacheStore() {
  const [dayDiets, setDayDiets] = createSignal<readonly DayDiet[]>([])

  createEffect(() => {
    logging.debug(`Cache size: `, { length: dayDiets().length })
  })

  return {
    clearCache() {
      logging.debug(`Clearing cache`)
      setDayDiets([])
    },

    upsertToCache(dayDiet: DayDiet) {
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
    },

    removeFromCache<T extends keyof DayDiet>(filter: {
      by: T
      value: DayDiet[T]
    }) {
      setDayDiets((days) => days.filter((d) => d[filter.by] !== filter.value))
    },

    createCacheItemSignal<T extends keyof DayDiet>(filter: {
      by: T
      value: DayDiet[T]
    }) {
      logging.debug(`findInCache filter=`, filter)
      const result =
        dayDiets().find((d) => d[filter.by] === filter.value) ?? null
      logging.debug(`findInCache result=`, { result })
      return result
    },

    runCacheManagement({
      currentTargetDay,
      userId,
      currentDayDiet,
    }: {
      currentTargetDay: string
      userId: User['uuid']
      currentDayDiet: Accessor<DayDiet | null>
    }) {
      logging.debug(`Effect - Refetch/Manage cache`)
      const existingDays = untrack(() => untrack(dayDiets))
      const currentDayDiet_ = untrack(() => untrack(currentDayDiet))

      // If any day is from other user, purge cache
      if (existingDays.find((d) => d.user_id !== userId) !== undefined) {
        logging.debug(`User changed! Purge cache`)
        this.clearCache()
        void fetchTargetDay(userId, currentTargetDay)
        return
      }

      logging.debug(
        `Target day effect - user: ${userId}, target: ${currentTargetDay}, cache size: ${existingDays.length}`,
      )
      if (currentDayDiet_ === null) {
        logging.debug(
          `No day diet found for user ${userId} on ${currentTargetDay}, fetching...`,
        )
        void fetchTargetDay(userId, currentTargetDay)
      }
    },
  }
}
