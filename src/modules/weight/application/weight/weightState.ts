import { createEffect, onMount } from 'solid-js'

import { currentUserId } from '~/modules/user/application/user'
import { type User } from '~/modules/user/domain/user'
import { weightCacheStore } from '~/modules/weight/application/weight/store/weightCacheStore'
import { createWeightCrudService } from '~/modules/weight/application/weight/weightCrud'
import { weightSchema } from '~/modules/weight/domain/weight/weight'
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

function getWeightRepository():
  | typeof supabaseWeightRepository
  | typeof guestWeightRepository {
  return isGuestMode() ? guestWeightRepository : supabaseWeightRepository
}

async function fetchUserWeights(userId: User['uuid']) {
  try {
    const weights = await getWeightRepository().fetchUserWeights(userId)
    storageRepository.setCachedWeights(userId, weights)
    weightCacheStore.setWeights(weights)
    return weights
  } catch (error) {
    logging.error('Weight operation error:', error)
    throw error
  }
}

const userId = currentUserId()
const cachedWeights = parseWithStack(
  weightSchema.array(),
  storageRepository.getCachedWeights(userId),
)
if (cachedWeights.length > 0) {
  weightCacheStore.setWeights(cachedWeights)
}

onMount(() => {
  const userId = currentUserId()
  void fetchUserWeights(userId)
})

createEffect(() => {
  const userId = currentUserId()
  void fetchUserWeights(userId)
})

// CRUD operations service - temporary until fully migrated
export const weightCrudService = createWeightCrudService({
  weightRepository: getWeightRepository(),
  weightCacheRepository: storageRepository,
})

export const userWeights = weightCacheStore.weights

export function refetchUserWeights() {
  const userId = currentUserId()
  void fetchUserWeights(userId)
}

// Initialize realtime subscription
initializeWeightRealtime()
