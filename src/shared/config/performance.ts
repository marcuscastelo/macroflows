import type * as Sentry from '@sentry/solidstart'

import { sentry } from '~/shared/config/sentry'

/**
 * User flow categories for major spans
 */
export type UserFlowType =
  | 'user_flow.diet_management'
  | 'user_flow.food_search'
  | 'user_flow.recipe_management'
  | 'user_flow.weight_tracking'
  | 'user_flow.profile_management'
  | 'user_flow.authentication'

/**
 * User flow operations for granular tracking
 */
export type UserFlowOperation =
  // Diet Management
  | 'diet.day_create'
  | 'diet.day_edit'
  | 'diet.meal_add_item'
  | 'diet.meal_edit_item'
  | 'diet.meal_delete_item'
  | 'diet.day_copy'
  // Food Search
  | 'search.food_by_name'
  | 'search.food_by_barcode'
  | 'search.food_selection'
  | 'search.food_add_to_meal'
  // Recipe Management
  | 'recipe.create'
  | 'recipe.edit'
  | 'recipe.delete'
  | 'recipe.duplicate'
  | 'recipe.add_to_meal'
  // Weight Tracking
  | 'weight.record_entry'
  | 'weight.edit_entry'
  | 'weight.delete_entry'
  | 'weight.view_history'
  // Profile Management
  | 'profile.update_macro_targets'
  | 'profile.update_preferences'
  | 'profile.export_data'
  // Authentication
  | 'auth.login'
  | 'auth.logout'
  | 'auth.register'
  | 'auth.password_reset'

/**
 * Enhanced user flow context for detailed tracking
 */
export type UserFlowContext = {
  userId?: string
  entityId?: string | number
  entityType?: string
  searchQuery?: string
  itemCount?: number
  dataSize?: number
  errorCount?: number
  retryCount?: number
  cacheMiss?: boolean
  apiCallCount?: number
  dbQueryCount?: number
}

/**
 * Custom span types for sub-operations
 */
export type SpanType =
  | 'db.query'
  | 'api.call'
  | 'cache.read'
  | 'cache.write'
  | 'validation'
  | 'calculation'
  | 'ui.render'

/**
 * Performance span manager for major user flows
 */
class PerformanceSpanManager {
  private activeSpans = new Map<string, Sentry.Span>()

  /**
   * Start a custom span for a major user flow
   */
  startSpan(
    operation: UserFlowOperation,
    context?: UserFlowContext,
  ): string | null {
    if (!sentry.isSentryEnabled()) {
      return null
    }

    const spanId = this.generateSpanId(operation)
    const spanType = this.getUserFlowType(operation)

    const attributes: Record<string, string | number | boolean> = {
      'span.flow_type': spanType,
      'span.operation': operation,
    }

    // Add context attributes
    if (context) {
      if (context.userId !== undefined && context.userId !== '') {
        attributes['user.id'] = context.userId
      }
      if (context.entityId !== undefined && context.entityId !== '') {
        attributes['entity.id'] = String(context.entityId)
      }
      if (context.entityType !== undefined && context.entityType !== '') {
        attributes['entity.type'] = context.entityType
      }
      if (context.searchQuery !== undefined && context.searchQuery !== '') {
        attributes['search.query'] = context.searchQuery
      }
      if (context.itemCount !== undefined) {
        attributes['data.item_count'] = context.itemCount
      }
      if (context.dataSize !== undefined) {
        attributes['data.size_bytes'] = context.dataSize
      }
      if (context.cacheMiss !== undefined) {
        attributes['cache.miss'] = context.cacheMiss
      }
      if (context.apiCallCount !== undefined) {
        attributes['performance.api_calls'] = context.apiCallCount
      }
      if (context.dbQueryCount !== undefined) {
        attributes['performance.db_queries'] = context.dbQueryCount
      }
    }

    const span = sentry.startSpan(
      `${spanType}.${operation}`,
      spanType,
      attributes,
    )

    if (span) {
      this.activeSpans.set(spanId, span)

      // Add breadcrumb for span start
      sentry.addBreadcrumb(
        `Started user flow span: ${operation}`,
        'performance',
        {
          spanId,
          operation,
          context,
        },
        'info',
      )
    }

    return spanId
  }

  /**
   * Add attributes to track sub-operations within a user flow span
   */
  addSpanAttributes(
    spanId: string,
    operationName: string,
    operationType: SpanType,
    data?: Record<string, unknown>,
  ): void {
    const span = this.activeSpans.get(spanId)
    if (span === undefined) return

    const attributes: Record<string, string | number | boolean> = {
      'operation.type': operationType,
      'operation.name': operationName,
    }

    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean'
        ) {
          attributes[key] = value
        } else {
          attributes[key] = String(value)
        }
      })
    }

    // Add attributes to the user flow span
    Object.entries(attributes).forEach(([key, value]) => {
      span.setAttribute(key, value)
    })
  }

  /**
   * Record an error within a user flow span
   */
  recordError(
    spanId: string,
    error: Error,
    context?: Record<string, unknown>,
  ): void {
    const span = this.activeSpans.get(spanId)
    if (span === undefined) return

    // Record error on span
    span.recordException(error)
    span.setStatus({ code: 2, message: 'Internal error' })

    // Add error context as attributes
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        span.setAttribute(
          `error.${key}`,
          typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean'
            ? value
            : String(value),
        )
      })
    }

    sentry.addBreadcrumb(
      `User flow span error: ${error.message}`,
      'error',
      {
        spanId,
        error: error.name,
        message: error.message,
        context,
      },
      'error',
    )
  }

  /**
   * Complete a user flow span with success metrics
   */
  completeSpan(
    spanId: string,
    metrics?: {
      itemsProcessed?: number
      dataTransferred?: number
      cacheHits?: number
      cacheMisses?: number
      apiCalls?: number
      dbQueries?: number
      duration?: number
    },
  ): void {
    const span = this.activeSpans.get(spanId)
    if (span === undefined) return

    // Add final metrics as attributes
    if (metrics) {
      if (metrics.itemsProcessed !== undefined) {
        span.setAttribute('metrics.items_processed', metrics.itemsProcessed)
      }
      if (metrics.dataTransferred !== undefined) {
        span.setAttribute('metrics.data_transferred', metrics.dataTransferred)
      }
      if (metrics.cacheHits !== undefined) {
        span.setAttribute('metrics.cache_hits', metrics.cacheHits)
      }
      if (metrics.cacheMisses !== undefined) {
        span.setAttribute('metrics.cache_misses', metrics.cacheMisses)
      }
      if (metrics.apiCalls !== undefined) {
        span.setAttribute('metrics.api_calls', metrics.apiCalls)
      }
      if (metrics.dbQueries !== undefined) {
        span.setAttribute('metrics.db_queries', metrics.dbQueries)
      }
    }

    // Set success status
    span.setStatus({ code: 1, message: 'OK' })

    // Add completion breadcrumb
    sentry.addBreadcrumb(
      `Completed user flow span: ${spanId}`,
      'performance',
      {
        spanId,
        metrics,
      },
      'info',
    )

    // End the span
    span.end()
    this.activeSpans.delete(spanId)
  }

  /**
   * Abort a user flow span due to error or cancellation
   */
  abortSpan(spanId: string, reason: string, error?: Error): void {
    const span = this.activeSpans.get(spanId)
    if (span === undefined) return

    // Set abort status and reason
    span.setAttribute('abort.reason', reason)
    span.setStatus({ code: 2, message: 'Aborted' })

    if (error) {
      span.recordException(error)
    }

    sentry.addBreadcrumb(
      `Aborted user flow span: ${spanId}`,
      'performance',
      {
        spanId,
        reason,
        error: error?.message,
      },
      'warning',
    )

    span.end()
    this.activeSpans.delete(spanId)
  }

  /**
   * Get active span count for monitoring
   */
  getActiveSpanCount(): number {
    return this.activeSpans.size
  }

  /**
   * Generate unique span ID
   */
  private generateSpanId(operation: UserFlowOperation): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `${operation}_${timestamp}_${random}`
  }

  /**
   * Map operation to user flow type
   */
  private getUserFlowType(operation: UserFlowOperation): UserFlowType {
    if (operation.startsWith('diet.')) return 'user_flow.diet_management'
    if (operation.startsWith('search.')) return 'user_flow.food_search'
    if (operation.startsWith('recipe.')) return 'user_flow.recipe_management'
    if (operation.startsWith('weight.')) return 'user_flow.weight_tracking'
    if (operation.startsWith('profile.')) return 'user_flow.profile_management'
    if (operation.startsWith('auth.')) return 'user_flow.authentication'

    return 'user_flow.diet_management' // fallback
  }
}

// Singleton instance
export const performanceManager = new PerformanceSpanManager()

/**
 * Utility function to wrap async operations with transaction tracking
 */
export async function withUserFlowSpan<T>(
  operation: UserFlowOperation,
  fn: (spanId: string | null) => Promise<T>,
  context?: UserFlowContext,
): Promise<T> {
  const spanId = performanceManager.startSpan(operation, context)

  try {
    const result = await fn(spanId)

    if (spanId !== null && spanId !== '') {
      performanceManager.completeSpan(spanId)
    }

    return result
  } catch (error) {
    if (spanId !== null && spanId !== '') {
      performanceManager.recordError(
        spanId,
        error instanceof Error ? error : new Error(String(error)),
      )
      performanceManager.abortSpan(
        spanId,
        'Operation failed',
        error instanceof Error ? error : new Error(String(error)),
      )
    }
    throw error
  }
}

/**
 * Decorator for automatic user flow span tracking on methods
 */
export function trackUserFlowSpan(
  operation: UserFlowOperation,
  getContext?: (...args: unknown[]) => UserFlowContext,
) {
  return function <T extends (...args: unknown[]) => Promise<unknown>>(
    _target: unknown,
    _propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
  ) {
    const originalMethod = descriptor.value

    if (originalMethod === undefined) return descriptor

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const wrappedFunction = async function (this: unknown, ...args: unknown[]) {
      const context = getContext ? getContext(...args) : undefined

      return await withUserFlowSpan(
        operation,
        async () => await originalMethod.apply(this, args),
        context,
      )
    } as T

    descriptor.value = wrappedFunction

    return descriptor
  }
}
