import { createEffect, createSignal, untrack } from 'solid-js'

import { type RecentFood } from '~/modules/recent-food/domain/recentFood'
import { logging } from '~/shared/utils/logging'

const [recentFoods, setRecentFoods] = createSignal<readonly RecentFood[]>([])

function clearCache() {
  logging.debug(`Clearing cache`)
  setRecentFoods([])
}

function upsertToCache(recentFood: RecentFood) {
  logging.debug(`Upserting recent food:`, recentFood)
  const existingIndex = untrack(recentFoods).findIndex(
    (rf) => rf.id === recentFood.id,
  )
  setRecentFoods((existingRecentFoods) => {
    const foods = [...existingRecentFoods]
    if (existingIndex >= 0) {
      foods[existingIndex] = recentFood
    } else {
      foods.push(recentFood)
      // Sort by last_used descending (most recent first)
      foods.sort((a, b) => b.last_used.getTime() - a.last_used.getTime())
    }
    return foods
  })
}

function removeFromCache<T extends keyof RecentFood>(filter: {
  by: T
  value: RecentFood[T]
}) {
  setRecentFoods((foods) =>
    foods.filter((rf) => rf[filter.by] !== filter.value),
  )
}

function createCacheItemSignal<T extends keyof RecentFood>(filter: {
  by: T
  value: RecentFood[T]
}) {
  logging.debug(`findInCache filter=`, filter)
  const result =
    recentFoods().find((rf) => rf[filter.by] === filter.value) ?? null
  logging.debug(`findInCache result=`, result)
  return result
}

export const recentFoodCacheStore = {
  recentFoods,
  setRecentFoods,
  clearCache,
  upsertToCache,
  removeFromCache,
  createCacheItemSignal,
}

createEffect(() => {
  logging.debug(`Recent foods cache size: `, recentFoods().length)
})
