import { createEffect, createRoot, onMount } from 'solid-js'

import { useCases } from '~/di/useCases'
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
import { logging } from '~/shared/utils/logging'
import { parseWithStack } from '~/shared/utils/parseWithStack'

/**
 * Factory that creates weight-related use-cases.
 *
 * Accepts optional overrides for repositories, store creators and utilities so
 * DI wiring or testing with fakes is possible. When no overrides are provided,
 * the current module defaults are used (keeps backward-compatible behavior).
 */
export function createWeightUseCases(deps?: {
  useCases?: typeof useCases
  createLocalStorageWeightCacheRepository?: typeof createLocalStorageWeightCacheRepository
  createSupabaseWeightGateway?: typeof createSupabaseWeightGateway
  createGuestWeightRepository?: typeof createGuestWeightRepository
  createWeightCacheStore?: typeof createWeightCacheStore
  initializeWeightRealtime?: typeof initializeWeightRealtime
  createWeightCrudService?: typeof createWeightCrudService
  parseWithStack?: typeof parseWithStack
}) {
  const {
    useCases: injectedUseCases,
    createLocalStorageWeightCacheRepository: injectedCreateLocalStorage,
    createSupabaseWeightGateway: injectedCreateSupabase,
    createGuestWeightRepository: injectedCreateGuest,
    createWeightCacheStore: injectedCreateWeightCacheStore,
    initializeWeightRealtime: injectedInitializeRealtime,
    createWeightCrudService: injectedCreateWeightCrudService,
    parseWithStack: injectedParseWithStack,
  } = deps ?? {}

  const localUseCases = injectedUseCases ?? useCases
  const localCreateLocalStorage =
    injectedCreateLocalStorage ?? createLocalStorageWeightCacheRepository
  const localCreateSupabase =
    injectedCreateSupabase ?? createSupabaseWeightGateway
  const localCreateGuest = injectedCreateGuest ?? createGuestWeightRepository
  const localCreateWeightCacheStore =
    injectedCreateWeightCacheStore ?? createWeightCacheStore
  const localInitializeRealtime =
    injectedInitializeRealtime ?? initializeWeightRealtime
  const localCreateWeightCrudService =
    injectedCreateWeightCrudService ?? createWeightCrudService
  const localParseWithStack = injectedParseWithStack ?? parseWithStack

  return createRoot(() => {
    const storageRepository = localCreateLocalStorage()
    const supabaseWeightRepository = localCreateSupabase()
    const guestWeightRepository = localCreateGuest()

    const cache = localCreateWeightCacheStore()

    // Initialize realtime listeners (kept inside the factory root)
    localInitializeRealtime({
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

    // Helper: pick the right repo according to guest mode
    function getWeightRepository():
      | typeof supabaseWeightRepository
      | typeof guestWeightRepository {
      const guestUseCases = localUseCases.guestUseCases()
      return guestUseCases.isGuestMode()
        ? guestWeightRepository
        : supabaseWeightRepository
    }

    // CRUD operations service factory
    const weightCrudService = () =>
      localCreateWeightCrudService({
        weightRepository: getWeightRepository(),
        weightCacheRepository: storageRepository,
      })

    // Internal fetch implementation
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

    // Public refetch function (reads current user id and refetches)
    function refetchUserWeights() {
      const authUseCases = localUseCases.authUseCases()
      const userId = authUseCases.currentUserIdOrGuestId()
      void fetchUserWeights(userId)
    }

    // Lifecycle: on mount and effect to keep cache in sync
    onMount(() => {
      const authUseCases = localUseCases.authUseCases()
      const userId = authUseCases.currentUserIdOrGuestId()
      void fetchUserWeights(userId)
    })

    createEffect(() => {
      const authUseCases = localUseCases.authUseCases()
      const userId = authUseCases.currentUserIdOrGuestId()
      void fetchUserWeights(userId)

      const cachedWeights = localParseWithStack(
        weightSchema.array(),
        storageRepository.getCachedWeights(userId),
      )
      if (cachedWeights.length > 0) {
        cache.setWeights(cachedWeights)
      }
    })

    // Exposed use-cases object
    const obj = {
      weights: () => cache.weights(),
      latest: () => WeightsExt.of(cache.weights()).latest(),
      oldest: () => WeightsExt.of(cache.weights()).oldest(),
      effectiveAt: (date: Date) =>
        WeightsExt.of(cache.weights()).effectiveAt(date),
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
      refetchUserWeights,
    }

    return obj
  })
}

/**
 * Backward-compatible shim kept for legacy consumers.
 * Consumers may continue to import `weightUseCases` and `refetchUserWeights`.
 */
export const weightUseCases = createWeightUseCases()

export function refetchUserWeights() {
  return weightUseCases.refetchUserWeights()
}
