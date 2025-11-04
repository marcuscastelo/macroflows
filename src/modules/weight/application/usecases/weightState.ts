import { createEffect, onMount } from 'solid-js'

import { currentUserId } from '~/modules/user/application/user'
import { type User } from '~/modules/user/domain/user'
import { createWeightCrudService } from '~/modules/weight/application/usecases/weightCrud'
import { weightSchema } from '~/modules/weight/domain/weight'
import { createLocalStorageWeightRepository } from '~/modules/weight/infrastructure/localStorage/localStorageRepository'
import { weightCacheStore } from '~/modules/weight/infrastructure/signals/weightCacheStore'
import { initializeWeightRealtime } from '~/modules/weight/infrastructure/supabase/realtime'
import { createSupabaseWeightGateway } from '~/modules/weight/infrastructure/supabase/supabaseWeightGateway'
import { logging } from '~/shared/utils/logging'
import { parseWithStack } from '~/shared/utils/parseWithStack'

const storageRepository = createLocalStorageWeightRepository()
const weightRepository = createSupabaseWeightGateway()

async function fetchUserWeights(userId: User['uuid']) {
  try {
    const weights = await weightRepository.fetchUserWeights(userId)
    storageRepository.setCachedWeights(userId, weights)
    weightCacheStore.setWeights(weights)
    return weights
  } catch (error) {
    logging.error('Weight operation error:', error)
    throw error
  }
}

const cachedWeights = parseWithStack(
  weightSchema.array(),
  storageRepository.getCachedWeights(currentUserId()),
)
if (cachedWeights.length > 0) {
  weightCacheStore.setWeights(cachedWeights)
}

onMount(() => {
  void fetchUserWeights(currentUserId())
})

createEffect(() => {
  const userId = currentUserId()
  void fetchUserWeights(userId)
})

// CRUD operations service - temporary until fully migrated
export const weightCrudService = createWeightCrudService({
  weightRepository,
  storageRepository,
})

export const userWeights = weightCacheStore.weights

export function refetchUserWeights() {
  void fetchUserWeights(currentUserId())
}

// Initialize realtime subscription
initializeWeightRealtime()
