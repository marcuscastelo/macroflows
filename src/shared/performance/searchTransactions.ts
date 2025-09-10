import { type Food } from '~/modules/diet/food/domain/food'
import {
  performanceManager,
  withTransaction,
} from '~/shared/config/performance'

/**
 * Food Search Transaction Wrappers
 *
 * These functions wrap major search-related user flows with performance tracking
 */

/**
 * Track food search by name operations
 */
export async function trackFoodSearch<T>(
  searchQuery: string,
  operation: () => Promise<T>,
  userId?: string,
): Promise<T> {
  return await withTransaction(
    'search.food_by_name',
    async (transactionId) => {
      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'validate_search_query',
          'validation',
          {
            queryLength: searchQuery.length,
            hasSpecialChars: /[^a-zA-Z0-9\s]/.test(searchQuery),
          },
        )

        performanceManager.addSpan(
          transactionId,
          'check_search_cache',
          'cache.read',
          { searchQuery },
        )
      }

      const result = await operation()

      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'process_search_results',
          'calculation',
          { searchQuery },
        )
      }

      return result
    },
    {
      userId,
      searchQuery,
      entityType: 'food_search',
    },
  )
}

/**
 * Track barcode scanning operations
 */
export async function trackBarcodeSearch<T>(
  barcode: string,
  operation: () => Promise<T>,
  userId?: string,
): Promise<T> {
  return await withTransaction(
    'search.food_by_barcode',
    async (transactionId) => {
      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'validate_barcode',
          'validation',
          {
            barcodeLength: barcode.length,
            barcodeType: barcode.length === 13 ? 'EAN13' : 'UPC',
          },
        )

        performanceManager.addSpan(
          transactionId,
          'check_barcode_cache',
          'cache.read',
          { barcode },
        )
      }

      const result = await operation()

      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'process_barcode_result',
          'calculation',
          { barcode },
        )
      }

      return result
    },
    {
      userId,
      entityType: 'barcode_search',
      entityId: barcode,
    },
  )
}

/**
 * Track food selection and addition to meal
 */
export async function trackFoodSelection<T>(
  food: Food,
  mealId: string,
  userId: string,
  operation: () => Promise<T>,
): Promise<T> {
  return await withTransaction(
    'search.food_selection',
    async (transactionId) => {
      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'validate_food_selection',
          'validation',
          {
            foodId: food.id,
            foodName: food.name,
            mealId,
          },
        )

        performanceManager.addSpan(
          transactionId,
          'calculate_portion_nutrition',
          'calculation',
          {
            baseCalories:
              food.macros.carbs * 4 +
              food.macros.protein * 4 +
              food.macros.fat * 9,
            baseProtein: food.macros.protein,
          },
        )
      }

      const result = await operation()

      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'add_to_recent_foods',
          'cache.write',
          { userId, foodId: food.id },
        )
      }

      return result
    },
    {
      userId,
      entityType: 'food_selection',
      entityId: food.id,
    },
  )
}

/**
 * Track comprehensive search session with multiple queries
 */
export async function trackSearchSession<T>(
  userId: string,
  sessionId: string,
  operation: () => Promise<T>,
): Promise<T> {
  return await withTransaction(
    'search.food_selection',
    async (transactionId) => {
      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'initialize_search_session',
          'cache.read',
          { userId, sessionId },
        )
      }

      const result = await operation()

      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'finalize_search_session',
          'cache.write',
          { userId, sessionId },
        )
      }

      return result
    },
    {
      userId,
      entityType: 'search_session',
      entityId: sessionId,
    },
  )
}

/**
 * Track API food data fetching operations
 */
export async function trackFoodApiFetch<T>(
  endpoint: string,
  operation: () => Promise<T>,
  query: string,
): Promise<T> {
  return await withTransaction(
    'search.food_by_name',
    async (transactionId) => {
      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          `fetch_${endpoint}`,
          'api.call',
          {
            endpoint,
            query,
            queryType: /^\d+$/.test(query) ? 'barcode' : 'name',
          },
        )
      }

      const result = await operation()

      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'process_api_response',
          'calculation',
          { endpoint, query },
        )

        performanceManager.addSpan(
          transactionId,
          'cache_api_result',
          'cache.write',
          { endpoint, query },
        )
      }

      return result
    },
    {
      searchQuery: query,
      entityType: 'api_food_fetch',
      apiCallCount: 1,
    },
  )
}

/**
 * Utility to track search performance metrics
 */
export function trackSearchMetrics(
  transactionId: string | null,
  metrics: {
    resultsCount?: number
    apiResponseTime?: number
    cacheHitRate?: number
    queryComplexity?: 'simple' | 'medium' | 'complex'
  },
): void {
  if (transactionId === null) return

  performanceManager.addSpan(
    transactionId,
    'search_performance_metrics',
    'calculation',
    {
      resultsCount: metrics.resultsCount ?? 0,
      apiResponseTime: metrics.apiResponseTime ?? 0,
      cacheHitRate: metrics.cacheHitRate ?? 0,
      queryComplexity: metrics.queryComplexity ?? 'simple',
    },
  )
}

/**
 * Utility to track search cache operations
 */
export function trackSearchCache(
  transactionId: string | null,
  operation: 'hit' | 'miss' | 'write',
  cacheKey: string,
  metadata?: Record<string, unknown>,
): void {
  if (transactionId === null) return

  performanceManager.addSpan(
    transactionId,
    `cache_${operation}`,
    operation === 'write' ? 'cache.write' : 'cache.read',
    {
      cacheKey,
      cacheMiss: operation === 'miss',
      ...metadata,
    },
  )
}
