import { type User } from '~/modules/user/domain/user'
import type { WeightStorageRepository } from '~/modules/weight/domain/storageRepository'
import { jsonParseWithStack } from '~/shared/utils/jsonParseWithStack'

const CHART_TYPE_KEY = 'weight-evolution-chart-type'

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

function getChartType(): string | null {
  return localStorage.getItem(CHART_TYPE_KEY)
}

function setChartType(chartType: string): void {
  localStorage.setItem(CHART_TYPE_KEY, chartType)
}

/**
 * Factory function to create localStorage weight repository
 */
export function createLocalStorageWeightRepository(): WeightStorageRepository {
  return {
    getCachedWeights,
    setCachedWeights,
    getChartType,
    setChartType,
  }
}
