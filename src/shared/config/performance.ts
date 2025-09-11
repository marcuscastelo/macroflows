import type * as Sentry from '@sentry/solidstart'

import { sentry } from '~/shared/config/sentry'

/**
 * Custom transaction types for major user flows
 */
export type TransactionType =
  | 'user_flow.diet_management'
  | 'user_flow.food_search'
  | 'user_flow.recipe_management'
  | 'user_flow.weight_tracking'
  | 'user_flow.profile_management'
  | 'user_flow.authentication'

/**
 * Transaction operations for granular tracking
 */
export type TransactionOperation =
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
 * Enhanced transaction context for detailed tracking
 */
export type TransactionContext = {
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
 * Performance transaction manager for major user flows
 */
class PerformanceTransactionManager {
  private activeTransactions = new Map<string, Sentry.Span>()

  /**
   * Start a custom transaction for a major user flow
   */
  startTransaction(
    operation: TransactionOperation,
    context?: TransactionContext,
  ): string | null {
    if (!sentry.isSentryEnabled()) {
      return null
    }

    const transactionId = this.generateTransactionId(operation)
    const transactionType = this.getTransactionType(operation)

    const attributes: Record<string, string | number | boolean> = {
      'transaction.type': transactionType,
      'transaction.operation': operation,
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
      `${transactionType}.${operation}`,
      transactionType,
      attributes,
    )

    if (span) {
      this.activeTransactions.set(transactionId, span)

      // Add breadcrumb for transaction start
      sentry.addBreadcrumb(
        `Started transaction: ${operation}`,
        'transaction',
        {
          transactionId,
          operation,
          context,
        },
        'info',
      )
    }

    return transactionId
  }

  /**
   * Add a custom span to track sub-operations within a transaction
   */
  addSpan(
    transactionId: string,
    spanName: string,
    spanType: SpanType,
    data?: Record<string, unknown>,
  ): void {
    const transaction = this.activeTransactions.get(transactionId)
    if (transaction === undefined) return

    const attributes: Record<string, string | number | boolean> = {
      'span.type': spanType,
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

    // Create child span within the transaction
    transaction.setAttribute('span.name', spanName)
    Object.entries(attributes).forEach(([key, value]) => {
      transaction.setAttribute(key, value)
    })
  }

  /**
   * Record an error within a transaction
   */
  recordError(
    transactionId: string,
    error: Error,
    context?: Record<string, unknown>,
  ): void {
    const transaction = this.activeTransactions.get(transactionId)
    if (transaction === undefined) return

    // Record error on transaction
    transaction.recordException(error)
    transaction.setStatus({ code: 2, message: 'Internal error' })

    // Add error context as attributes
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        transaction.setAttribute(
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
      `Transaction error: ${error.message}`,
      'error',
      {
        transactionId,
        error: error.name,
        message: error.message,
        context,
      },
      'error',
    )
  }

  /**
   * Complete a transaction with success metrics
   */
  completeTransaction(
    transactionId: string,
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
    const transaction = this.activeTransactions.get(transactionId)
    if (transaction === undefined) return

    // Add final metrics as attributes
    if (metrics) {
      if (metrics.itemsProcessed !== undefined) {
        transaction.setAttribute(
          'metrics.items_processed',
          metrics.itemsProcessed,
        )
      }
      if (metrics.dataTransferred !== undefined) {
        transaction.setAttribute(
          'metrics.data_transferred',
          metrics.dataTransferred,
        )
      }
      if (metrics.cacheHits !== undefined) {
        transaction.setAttribute('metrics.cache_hits', metrics.cacheHits)
      }
      if (metrics.cacheMisses !== undefined) {
        transaction.setAttribute('metrics.cache_misses', metrics.cacheMisses)
      }
      if (metrics.apiCalls !== undefined) {
        transaction.setAttribute('metrics.api_calls', metrics.apiCalls)
      }
      if (metrics.dbQueries !== undefined) {
        transaction.setAttribute('metrics.db_queries', metrics.dbQueries)
      }
    }

    // Set success status
    transaction.setStatus({ code: 1, message: 'OK' })

    // Add completion breadcrumb
    sentry.addBreadcrumb(
      `Completed transaction: ${transactionId}`,
      'transaction',
      {
        transactionId,
        metrics,
      },
      'info',
    )

    // End the transaction
    transaction.end()
    this.activeTransactions.delete(transactionId)
  }

  /**
   * Abort a transaction due to error or cancellation
   */
  abortTransaction(transactionId: string, reason: string, error?: Error): void {
    const transaction = this.activeTransactions.get(transactionId)
    if (transaction === undefined) return

    // Set abort status and reason
    transaction.setAttribute('abort.reason', reason)
    transaction.setStatus({ code: 2, message: 'Aborted' })

    if (error) {
      transaction.recordException(error)
    }

    sentry.addBreadcrumb(
      `Aborted transaction: ${transactionId}`,
      'transaction',
      {
        transactionId,
        reason,
        error: error?.message,
      },
      'warning',
    )

    transaction.end()
    this.activeTransactions.delete(transactionId)
  }

  /**
   * Get active transaction count for monitoring
   */
  getActiveTransactionCount(): number {
    return this.activeTransactions.size
  }

  /**
   * Generate unique transaction ID
   */
  private generateTransactionId(operation: TransactionOperation): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `${operation}_${timestamp}_${random}`
  }

  /**
   * Map operation to transaction type
   */
  private getTransactionType(operation: TransactionOperation): TransactionType {
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
export const performanceManager = new PerformanceTransactionManager()

/**
 * Utility function to wrap async operations with transaction tracking
 */
export async function withTransaction<T>(
  operation: TransactionOperation,
  fn: (transactionId: string | null) => Promise<T>,
  context?: TransactionContext,
): Promise<T> {
  const transactionId = performanceManager.startTransaction(operation, context)

  try {
    const result = await fn(transactionId)

    if (transactionId !== null && transactionId !== '') {
      performanceManager.completeTransaction(transactionId)
    }

    return result
  } catch (error) {
    if (transactionId !== null && transactionId !== '') {
      performanceManager.recordError(
        transactionId,
        error instanceof Error ? error : new Error(String(error)),
      )
      performanceManager.abortTransaction(
        transactionId,
        'Operation failed',
        error instanceof Error ? error : new Error(String(error)),
      )
    }
    throw error
  }
}

/**
 * Decorator for automatic transaction tracking on methods
 */
export function trackTransaction(
  operation: TransactionOperation,
  getContext?: (...args: unknown[]) => TransactionContext,
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

      return await withTransaction(
        operation,
        async () => await originalMethod.apply(this, args),
        context,
      )
    } as T

    descriptor.value = wrappedFunction

    return descriptor
  }
}
