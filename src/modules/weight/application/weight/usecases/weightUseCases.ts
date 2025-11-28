import { createEffect, createRoot, onMount } from 'solid-js'

import { currentUserId } from '~/modules/user/application/user'
import { type User } from '~/modules/user/domain/user'
import { createWeightCacheStore } from '~/modules/weight/application/weight/store/weightCacheStore'
import { createWeightCrudService } from '~/modules/weight/application/weight/weightCrud'
import {
  createNewWeight,
  type Weight,
  weightSchema,
} from '~/modules/weight/domain/weight/weight'
import { WeightsExt } from '~/modules/weight/domain/weight/weightsExt'
import { createGuestWeightRepository } from '~/modules/weight/infrastructure/weight/guest/guestWeightRepository'
import { createLocalStorageWeightCacheRepository } from '~/modules/weight/infrastructure/weight/localStorage/localStorageWeightCacheRepository'
import { createSupabaseWeightGateway } from '~/modules/weight/infrastructure/weight/supabase/supabaseWeightGateway'
import { isGuestMode } from '~/shared/guest/guestState'
import { logging } from '~/shared/utils/logging'
import { parseWithStack } from '~/shared/utils/parseWithStack'

const storageRepository = createLocalStorageWeightCacheRepository()
const supabaseWeightRepository = createSupabaseWeightGateway()
const guestWeightRepository = createGuestWeightRepository()

const cache = createRoot(() => createWeightCacheStore())

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
    weightUseCases.temp_bypass_get_store().setWeights(cachedWeights)
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
    weightUseCases.temp_bypass_get_store().setWeights(weights)
    return weights
  } catch (error) {
    logging.error('Weight operation error:', error)
    throw error
  }
}

async function insertWeight(weight: Weight['weight']) {
  const userId = currentUserId()

  await weightCrudService().insertWeight(
    createNewWeight({
      user_id: userId,
      weight,
      target_timestamp: new Date(Date.now()),
    }),
  )
}

export const weightUseCases = {
  weights: () => cache.weights(),
  temp_bypass_get_store: () => cache,
  latest: () => WeightsExt.of(cache.weights()).latest(),
  oldest: () => WeightsExt.of(cache.weights()).oldest(),
  effectiveAt: (date: Date) => WeightsExt.of(cache.weights()).effectiveAt(date),
  insertWeight,
  updateWeight: (weightId: Weight['id'], newWeight: Weight) =>
    weightCrudService().updateWeight(weightId, newWeight),
  deleteWeight: (id: Weight['id']) => weightCrudService().deleteWeight(id),
}
