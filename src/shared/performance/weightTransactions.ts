import { type Weight } from '~/modules/weight/domain/weight'
import {
  performanceManager,
  withUserFlowSpan,
} from '~/shared/config/performance'

/**
 * Track weight entry editing operations
 */
export async function trackWeightEdit<T>(
  weightId: string,
  changes: Partial<Weight>,
  userId: string,
  operation: () => Promise<T>,
): Promise<T> {
  return await withUserFlowSpan(
    'weight.edit_entry',
    async (spanId) => {
      if (spanId !== null) {
        performanceManager.addSpanAttributes(
          spanId,
          'validate_weight_changes',
          'validation',
          {
            weightId,
            hasValueChange: Boolean(changes.weight),
            hasDateChange: Boolean(changes.target_timestamp),
          },
        )

        performanceManager.addSpanAttributes(
          spanId,
          'fetch_existing_weight',
          'db.query',
          { weightId, userId },
        )
      }

      const result = await operation()

      if (spanId !== null) {
        performanceManager.addSpanAttributes(
          spanId,
          'update_weight_entry',
          'db.query',
          { weightId, userId },
        )

        performanceManager.addSpanAttributes(
          spanId,
          'recalculate_weight_trends',
          'calculation',
          { userId, weightId },
        )

        performanceManager.addSpanAttributes(
          spanId,
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
  return await withUserFlowSpan(
    'weight.delete_entry',
    async (spanId) => {
      if (spanId !== null) {
        performanceManager.addSpanAttributes(
          spanId,
          'validate_weight_deletion',
          'validation',
          { weightId, userId },
        )

        performanceManager.addSpanAttributes(
          spanId,
          'check_weight_existence',
          'db.query',
          { weightId, userId },
        )
      }

      const result = await operation()

      if (spanId !== null) {
        performanceManager.addSpanAttributes(
          spanId,
          'delete_weight_entry',
          'db.query',
          { weightId, userId },
        )

        performanceManager.addSpanAttributes(
          spanId,
          'recalculate_trends_after_deletion',
          'calculation',
          { userId, weightId },
        )

        performanceManager.addSpanAttributes(
          spanId,
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
  return await withUserFlowSpan(
    'weight.view_history',
    async (spanId) => {
      if (spanId !== null) {
        performanceManager.addSpanAttributes(
          spanId,
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

        performanceManager.addSpanAttributes(
          spanId,
          'check_weight_cache',
          'cache.read',
          { userId, ...dateRange },
        )
      }

      const result = await operation()

      if (spanId !== null) {
        performanceManager.addSpanAttributes(
          spanId,
          'fetch_weight_history',
          'db.query',
          { userId, ...dateRange },
        )

        performanceManager.addSpanAttributes(
          spanId,
          'calculate_weight_statistics',
          'calculation',
          { userId, ...dateRange },
        )

        performanceManager.addSpanAttributes(
          spanId,
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
  return await withUserFlowSpan(
    'weight.view_history',
    async (spanId) => {
      if (spanId !== null) {
        performanceManager.addSpanAttributes(
          spanId,
          'prepare_chart_data',
          'calculation',
          {
            chartType,
            dataPoints,
            userId,
          },
        )

        performanceManager.addSpanAttributes(
          spanId,
          'calculate_trend_lines',
          'calculation',
          {
            chartType,
            dataPoints,
          },
        )
      }

      const result = await operation()

      if (spanId !== null) {
        performanceManager.addSpanAttributes(
          spanId,
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
  return await withUserFlowSpan(
    'weight.view_history',
    async (spanId) => {
      if (spanId !== null) {
        performanceManager.addSpanAttributes(
          spanId,
          'fetch_weight_data_for_stats',
          'db.query',
          { userId, timeframe },
        )

        performanceManager.addSpanAttributes(
          spanId,
          'calculate_weight_averages',
          'calculation',
          { timeframe },
        )

        performanceManager.addSpanAttributes(
          spanId,
          'calculate_weight_trends',
          'calculation',
          { timeframe },
        )
      }

      const result = await operation()

      if (spanId !== null) {
        performanceManager.addSpanAttributes(
          spanId,
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
  spanId: string | null,
  operation: string,
  userId: string,
  metadata?: Record<string, unknown>,
): void {
  if (spanId === null) return

  performanceManager.addSpanAttributes(spanId, operation, 'calculation', {
    userId,
    ...metadata,
  })
}

/**
 * Utility to track weight database operations
 */
export function trackWeightDbOperation(
  spanId: string | null,
  operation: string,
  userId: string,
  metadata?: Record<string, unknown>,
): void {
  if (spanId === null) return

  performanceManager.addSpanAttributes(spanId, operation, 'db.query', {
    userId,
    ...metadata,
  })
}
