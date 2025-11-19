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

const userId = currentUserId()
if (userId !== undefined) {
  const cachedWeights = parseWithStack(
    weightSchema.array(),
    storageRepository.getCachedWeights(userId),
  )
  if (cachedWeights.length > 0) {
    weightCacheStore.setWeights(cachedWeights)
  }
}

onMount(() => {
  const userId = currentUserId()
  if (userId === undefined) {
    console.error('User ID is undefined')
    return
  }
  void fetchUserWeights(userId)
})

createEffect(() => {
  const userId = currentUserId()
  if (userId === undefined) {
    console.error('User ID is undefined')
    return
  }
  void fetchUserWeights(userId)
})

// CRUD operations service - temporary until fully migrated
export const weightCrudService = createWeightCrudService({
  weightRepository,
  storageRepository,
})

export const userWeights = weightCacheStore.weights

export function refetchUserWeights() {
  const userId = currentUserId()
  if (userId === undefined) {
    console.error('User ID is undefined')
    return
  }
  void fetchUserWeights(userId)
}

// Initialize realtime subscription
initializeWeightRealtime()
