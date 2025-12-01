import { createEffect, createRoot, onMount } from 'solid-js'

import { currentUserId } from '~/modules/user/application/user'
import { type User } from '~/modules/user/domain/user'
import { createWeightCacheStore } from '~/modules/weight/application/weight/store/weightCacheStore'
import { createWeightCrudService } from '~/modules/weight/application/weight/weightCrud'
import {
  type NewWeight,
  type Weight,
  weightSchema,
} from '~/modules/weight/domain/weight/weight'
import { WeightsExt } from '~/modules/weight/domain/weight/weightsExt'
import { createGuestWeightRepository } from '~/modules/weight/infrastructure/weight/guest/guestWeightRepository'
import { createLocalStorageWeightCacheRepository } from '~/modules/weight/infrastructure/weight/localStorage/localStorageWeightCacheRepository'
import { initializeWeightRealtime } from '~/modules/weight/infrastructure/weight/supabase/realtime'
import { createSupabaseWeightGateway } from '~/modules/weight/infrastructure/weight/supabase/supabaseWeightGateway'
import { isGuestMode } from '~/shared/guest/guestState'
import { logging } from '~/shared/utils/logging'
import { parseWithStack } from '~/shared/utils/parseWithStack'

const storageRepository = createLocalStorageWeightCacheRepository()
const supabaseWeightRepository = createSupabaseWeightGateway()
const guestWeightRepository = createGuestWeightRepository()

const cache = createRoot(() => {
  const cache = createWeightCacheStore()
  initializeWeightRealtime({
    onInsert: (weight: Weight) => {
      cache.upsertToCache(weight)
    },
    onUpdate: (weight: Weight) => {
      cache.upsertToCache(weight)
    },
    onDelete: (weight: Weight) => {
      cache.removeFromCache({ by: 'id', value: weight.id })
    },
  })
  return cache
})

onMount(() => {
  const userId = currentUserId()
  void fetchUserWeights(userId)
})

createEffect(() => {
  const userId = currentUserId()
  void fetchUserWeights(userId)

  const cachedWeights = parseWithStack(
    weightSchema.array(),
    storageRepository.getCachedWeights(userId),
  )
  if (cachedWeights.length > 0) {
    cache.setWeights(cachedWeights)
  }
})

export function refetchUserWeights() {
  const userId = currentUserId()
  void fetchUserWeights(userId)
}

function getWeightRepository():
  | typeof supabaseWeightRepository
  | typeof guestWeightRepository {
  return isGuestMode() ? guestWeightRepository : supabaseWeightRepository
}

// CRUD operations service - temporary until fully migrated
const weightCrudService = () =>
  createWeightCrudService({
    weightRepository: getWeightRepository(),
    weightCacheRepository: storageRepository,
  })

async function fetchUserWeights(userId: User['uuid']) {
  try {
    const weights = await getWeightRepository().fetchUserWeights(userId)
    storageRepository.setCachedWeights(userId, weights)
    cache.setWeights(weights)
    return weights
  } catch (error) {
    logging.error('Weight operation error:', error)
    throw error
  }
}

export const weightUseCases = {
  weights: () => cache.weights(),
  latest: () => WeightsExt.of(cache.weights()).latest(),
  oldest: () => WeightsExt.of(cache.weights()).oldest(),
  effectiveAt: (date: Date) => WeightsExt.of(cache.weights()).effectiveAt(date),
  insertWeight: (weight: NewWeight) =>
    weightCrudService()
      .insertWeight(weight)
      .then((weight) => cache.upsertToCache(weight)),
  updateWeight: (weightId: Weight['id'], newWeight: Weight) =>
    weightCrudService()
      .updateWeight(weightId, newWeight)
      .then((weight) => cache.upsertToCache(weight)),
  deleteWeight: (id: Weight['id']) =>
    weightCrudService()
      .deleteWeight(id)
      .then(() => cache.removeFromCache({ by: 'id', value: id })),
}
