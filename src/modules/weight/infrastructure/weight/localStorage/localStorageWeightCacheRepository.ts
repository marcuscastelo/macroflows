import { type User } from '~/modules/user/domain/user'
import { type WeightCacheRepository } from '~/modules/weight/domain/weight/weightCacheRepository'
import { jsonParseWithStack } from '~/shared/utils/jsonParseWithStack'

function getCachedWeights(userId: User['uuid']): readonly unknown[] {
  const key = `userWeights-${userId}`
  const stored = localStorage.getItem(key)
  if (stored === null) {
    return []
  }

  try {
    const parsed = jsonParseWithStack(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function setCachedWeights(
  userId: User['uuid'],
  weights: readonly unknown[],
): void {
  const key = `userWeights-${userId}`
  localStorage.setItem(key, JSON.stringify(weights))
}

/**
 * Factory function to create localStorage weight repository
 */
export function createLocalStorageWeightCacheRepository(): WeightCacheRepository {
  return {
    getCachedWeights,
    setCachedWeights,
  }
}
