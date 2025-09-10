import { type Weight } from '~/modules/weight/domain/weight'
import {
  performanceManager,
  withTransaction,
} from '~/shared/config/performance'

/**
 * Weight Tracking Transaction Wrappers
 *
 * These functions wrap major weight-related user flows with performance tracking
 */

/**
 * Track weight entry recording operations
 */
export async function trackWeightEntry<T>(
  weightData: Pick<Weight, 'weight' | 'target_timestamp'>,
  userId: string,
  operation: () => Promise<T>,
): Promise<T> {
  return await withTransaction(
    'weight.record_entry',
    async (transactionId) => {
      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'validate_weight_data',
          'validation',
          {
            weightValue: weightData.weight,
            measuredAt: weightData.target_timestamp,
          },
        )

        performanceManager.addSpan(
          transactionId,
          'check_duplicate_entry',
          'db.query',
          { userId, measuredAt: weightData.target_timestamp },
        )
      }

      const result = await operation()

      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'save_weight_entry',
          'db.query',
          { userId, weightValue: weightData.weight },
        )

        performanceManager.addSpan(
          transactionId,
          'update_weight_cache',
          'cache.write',
          { userId },
        )

        performanceManager.addSpan(
          transactionId,
          'calculate_weight_trends',
          'calculation',
          { userId, weightValue: weightData.weight },
        )
      }

      return result
    },
    {
      userId,
      entityType: 'weight_entry',
      entityId: String(weightData.target_timestamp),
    },
  )
}

/**
 * Track weight entry editing operations
 */
export async function trackWeightEdit<T>(
  weightId: string,
  changes: Partial<Weight>,
  userId: string,
  operation: () => Promise<T>,
): Promise<T> {
  return await withTransaction(
    'weight.edit_entry',
    async (transactionId) => {
      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'validate_weight_changes',
          'validation',
          {
            weightId,
            hasValueChange: Boolean(changes.weight),
            hasDateChange: Boolean(changes.target_timestamp),
          },
        )

        performanceManager.addSpan(
          transactionId,
          'fetch_existing_weight',
          'db.query',
          { weightId, userId },
        )
      }

      const result = await operation()

      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'update_weight_entry',
          'db.query',
          { weightId, userId },
        )

        performanceManager.addSpan(
          transactionId,
          'recalculate_weight_trends',
          'calculation',
          { userId, weightId },
        )

        performanceManager.addSpan(
          transactionId,
          'invalidate_weight_cache',
          'cache.write',
          { userId },
        )
      }

      return result
    },
    {
      userId,
      entityType: 'weight_entry',
      entityId: weightId,
    },
  )
}

/**
 * Track weight entry deletion operations
 */
export async function trackWeightDeletion<T>(
  weightId: string,
  userId: string,
  operation: () => Promise<T>,
): Promise<T> {
  return await withTransaction(
    'weight.delete_entry',
    async (transactionId) => {
      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'validate_weight_deletion',
          'validation',
          { weightId, userId },
        )

        performanceManager.addSpan(
          transactionId,
          'check_weight_existence',
          'db.query',
          { weightId, userId },
        )
      }

      const result = await operation()

      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'delete_weight_entry',
          'db.query',
          { weightId, userId },
        )

        performanceManager.addSpan(
          transactionId,
          'recalculate_trends_after_deletion',
          'calculation',
          { userId, weightId },
        )

        performanceManager.addSpan(
          transactionId,
          'update_weight_cache',
          'cache.write',
          { userId },
        )
      }

      return result
    },
    {
      userId,
      entityType: 'weight_entry',
      entityId: weightId,
    },
  )
}

/**
 * Track weight history viewing operations
 */
export async function trackWeightHistoryView<T>(
  userId: string,
  dateRange: { startDate: string; endDate: string },
  operation: () => Promise<T>,
): Promise<T> {
  return await withTransaction(
    'weight.view_history',
    async (transactionId) => {
      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'validate_date_range',
          'validation',
          {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            daySpan: Math.ceil(
              (new Date(dateRange.endDate).getTime() -
                new Date(dateRange.startDate).getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          },
        )

        performanceManager.addSpan(
          transactionId,
          'check_weight_cache',
          'cache.read',
          { userId, ...dateRange },
        )
      }

      const result = await operation()

      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'fetch_weight_history',
          'db.query',
          { userId, ...dateRange },
        )

        performanceManager.addSpan(
          transactionId,
          'calculate_weight_statistics',
          'calculation',
          { userId, ...dateRange },
        )

        performanceManager.addSpan(
          transactionId,
          'cache_weight_history',
          'cache.write',
          { userId, ...dateRange },
        )
      }

      return result
    },
    {
      userId,
      entityType: 'weight_history',
      entityId: `${dateRange.startDate}_to_${dateRange.endDate}`,
    },
  )
}

/**
 * Track weight chart rendering operations
 */
export async function trackWeightChartRender<T>(
  userId: string,
  chartType: 'line' | 'trend' | 'comparison',
  dataPoints: number,
  operation: () => Promise<T>,
): Promise<T> {
  return await withTransaction(
    'weight.view_history',
    async (transactionId) => {
      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'prepare_chart_data',
          'calculation',
          {
            chartType,
            dataPoints,
            userId,
          },
        )

        performanceManager.addSpan(
          transactionId,
          'calculate_trend_lines',
          'calculation',
          {
            chartType,
            dataPoints,
          },
        )
      }

      const result = await operation()

      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'render_weight_chart',
          'ui.render',
          {
            chartType,
            dataPoints,
            userId,
          },
        )
      }

      return result
    },
    {
      userId,
      entityType: 'weight_chart',
      itemCount: dataPoints,
    },
  )
}

/**
 * Track weight statistics calculations
 */
export async function trackWeightStatsCalculation<T>(
  userId: string,
  timeframe: 'week' | 'month' | 'quarter' | 'year',
  operation: () => Promise<T>,
): Promise<T> {
  return await withTransaction(
    'weight.view_history',
    async (transactionId) => {
      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'fetch_weight_data_for_stats',
          'db.query',
          { userId, timeframe },
        )

        performanceManager.addSpan(
          transactionId,
          'calculate_weight_averages',
          'calculation',
          { timeframe },
        )

        performanceManager.addSpan(
          transactionId,
          'calculate_weight_trends',
          'calculation',
          { timeframe },
        )
      }

      const result = await operation()

      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'cache_weight_statistics',
          'cache.write',
          { userId, timeframe },
        )
      }

      return result
    },
    {
      userId,
      entityType: 'weight_statistics',
      entityId: timeframe,
    },
  )
}

/**
 * Utility to track weight calculation operations
 */
export function trackWeightCalculation(
  transactionId: string | null,
  operation: string,
  userId: string,
  metadata?: Record<string, unknown>,
): void {
  if (transactionId === null) return

  performanceManager.addSpan(transactionId, operation, 'calculation', {
    userId,
    ...metadata,
  })
}

/**
 * Utility to track weight database operations
 */
export function trackWeightDbOperation(
  transactionId: string | null,
  operation: string,
  userId: string,
  metadata?: Record<string, unknown>,
): void {
  if (transactionId === null) return

  performanceManager.addSpan(transactionId, operation, 'db.query', {
    userId,
    ...metadata,
  })
}
