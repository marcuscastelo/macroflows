import { createEffect, createRoot } from 'solid-js'

import { type User } from '~/modules/user/domain/user'
import { createWeightCacheStore } from '~/modules/weight/application/weight/store/weightCacheStore'
import { createWeightCrudService } from '~/modules/weight/application/weight/weightCrud'
import {
  type NewWeight,
  type Weight,
  weightSchema,
} from '~/modules/weight/domain/weight/weight'
import { type WeightCacheRepository } from '~/modules/weight/domain/weight/weightCacheRepository'
import { type WeightRepository } from '~/modules/weight/domain/weight/weightRepository'
import { WeightsExt } from '~/modules/weight/domain/weight/weightsExt'
import { createWeightRealtimeService } from '~/modules/weight/infrastructure/weight/supabase/realtime'
import { logging } from '~/shared/utils/logging'
import { parseWithStack } from '~/shared/utils/parseWithStack'

/**
 * Granular dependencies for weight use-cases.
 * These replace the full `useCases` object to avoid circular dependencies.
 */
export type WeightUseCasesDeps = {
  /** Returns the current user ID or guest ID */
  getCurrentUserIdOrGuestId: () => string
  /** Returns true if the app is in guest mode */
  isGuestMode: () => boolean
}

/**
 * Factory that creates weight-related use-cases.
 *
 * Accepts optional overrides for repositories, store creators and utilities so
 * DI wiring or testing with fakes is possible. When no overrides are provided,
 * the current module defaults are used.
 */
export function createWeightUseCases(deps: {
  /** Granular auth/guest dependencies (required) */
  authDeps: WeightUseCasesDeps
  weightCacheRepository: WeightCacheRepository
  weightRepository: WeightRepository
  createWeightCacheStore?: typeof createWeightCacheStore
  createWeightRealtimeService?: typeof createWeightRealtimeService
  createWeightCrudService?: typeof createWeightCrudService
  parseWithStack?: typeof parseWithStack
}) {
  const {
    authDeps,
    weightCacheRepository,
    weightRepository,
    createWeightCacheStore: injectedCreateWeightCacheStore,
    createWeightRealtimeService: injectedCreateWeightRealtimeService,
    createWeightCrudService: injectedCreateWeightCrudService,
    parseWithStack: injectedParseWithStack,
  } = deps

  const localCreateWeightCacheStore =
    injectedCreateWeightCacheStore ?? createWeightCacheStore
  const localCreateWeightRealtimeService =
    injectedCreateWeightRealtimeService ?? createWeightRealtimeService
  const localCreateWeightCrudService =
    injectedCreateWeightCrudService ?? createWeightCrudService
  const localParseWithStack = injectedParseWithStack ?? parseWithStack

  return createRoot(() => {
    const cache = localCreateWeightCacheStore()
    const realtimeService = localCreateWeightRealtimeService()
    let realtimeInitialized = false

    function initializeRealtime() {
      if (realtimeInitialized) {
        return
      }
      realtimeInitialized = true

      realtimeService.initializeWeightRealtime({
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
    }

    // CRUD operations service factory
    const weightCrudService = () =>
      localCreateWeightCrudService({
        weightRepository,
        weightCacheRepository,
      })

    // Internal fetch implementation
    async function fetchUserWeights(userId: User['uuid']) {
      try {
        const weights = await weightRepository.fetchUserWeights(userId)
        weightCacheRepository.setCachedWeights(userId, weights)
        cache.setWeights(weights)
        return weights
      } catch (error) {
        logging.error('Weight operation error:', error)
        throw error
      }
    }

    // Public refetch function (reads current user id and refetches)
    function refetchUserWeights() {
      const userId = authDeps.getCurrentUserIdOrGuestId()
      void fetchUserWeights(userId)
    }

    createEffect(() => {
      const userId = authDeps.getCurrentUserIdOrGuestId()
      void fetchUserWeights(userId)

      const cachedWeights = localParseWithStack(
        weightSchema.array(),
        weightCacheRepository.getCachedWeights(userId),
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
      initializeRealtime,
    }

    return obj
  })
}

/**
 * Type representing the weight use-cases returned by the factory.
 */
export type WeightUseCases = ReturnType<typeof createWeightUseCases>
