import { createEffect, createSignal, untrack } from 'solid-js'

import { type Weight } from '~/modules/weight/domain/weight'
import { logging } from '~/shared/utils/logging'

const [weights, setWeights] = createSignal<readonly Weight[]>([])

function clearCache() {
  logging.debug(`Clearing weight cache`)
  setWeights([])
}

function upsertToCache(weight: Weight) {
  logging.debug(`Upserting weight:`, weight)
  const existingIndex = untrack(weights).findIndex((w) => w.id === weight.id)
  setWeights((existingWeights) => {
    const weightList = [...existingWeights]
    if (existingIndex >= 0) {
      weightList[existingIndex] = weight
    } else {
      weightList.push(weight)
      weightList.sort(
        (a, b) => a.target_timestamp.getTime() - b.target_timestamp.getTime(),
      )
    }
    return weightList
  })
}

function removeFromCache<T extends keyof Weight>(filter: {
  by: T
  value: Weight[T]
}) {
  setWeights((weightList) =>
    weightList.filter((w) => w[filter.by] !== filter.value),
  )
}

function createCacheItemSignal<T extends keyof Weight>(filter: {
  by: T
  value: Weight[T]
}) {
  logging.debug(`findInCache filter=`, filter)
  const result = weights().find((w) => w[filter.by] === filter.value) ?? null
  logging.debug(`findInCache result=`, { result })
  return result
}

export const weightCacheStore = {
  weights,
  setWeights,
  clearCache,
  upsertToCache,
  removeFromCache,
  createCacheItemSignal,
}

createEffect(() => {
  logging.debug(`Weight cache size: `, { length: weights().length })
})
