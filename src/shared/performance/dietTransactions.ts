import { type UnifiedItem } from '~/modules/diet/unified-item/schema/unifiedItemSchema'
import {
  performanceManager,
  withTransaction,
} from '~/shared/config/performance'

/**
 * Diet Management Transaction Wrappers
 *
 * These functions wrap major diet-related user flows with performance tracking
 */

/**
 * Track day creation operations
 */
export async function trackDayCreation<T>(
  userId: string,
  date: string,
  operation: () => Promise<T>,
): Promise<T> {
  return await withTransaction(
    'diet.day_create',
    async (transactionId) => {
      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'validate_day_creation',
          'validation',
          { userId, date },
        )
      }

      const result = await operation()

      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'day_created_successfully',
          'calculation',
          { userId, date },
        )
      }

      return result
    },
    {
      userId,
      entityType: 'day_diet',
      entityId: date,
    },
  )
}

/**
 * Track meal item addition operations
 */
export async function trackMealItemAddition<T>(
  userId: string,
  mealId: string,
  item: UnifiedItem,
  operation: () => Promise<T>,
): Promise<T> {
  return await withTransaction(
    'diet.meal_add_item',
    async (transactionId) => {
      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'validate_item_addition',
          'validation',
          {
            userId,
            mealId,
            itemType: item.reference.type,
            itemId: item.id,
          },
        )
      }

      const result = await operation()

      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'calculate_nutrition_impact',
          'calculation',
          {
            calories:
              item.reference.type === 'food'
                ? item.reference.macros.carbs * 4 +
                  item.reference.macros.protein * 4 +
                  item.reference.macros.fat * 9
                : 0,
            protein:
              item.reference.type === 'food'
                ? item.reference.macros.protein
                : 0,
            carbs:
              item.reference.type === 'food' ? item.reference.macros.carbs : 0,
            fat: item.reference.type === 'food' ? item.reference.macros.fat : 0,
          },
        )
      }

      return result
    },
    {
      userId,
      entityType: 'meal_item',
      entityId: item.id,
      itemCount: 1,
    },
  )
}

/**
 * Track meal item editing operations
 */
export async function trackMealItemEdit<T>(
  userId: string,
  itemId: string,
  changes: Partial<UnifiedItem>,
  operation: () => Promise<T>,
): Promise<T> {
  return await withTransaction(
    'diet.meal_edit_item',
    async (transactionId) => {
      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'validate_item_changes',
          'validation',
          {
            userId,
            itemId,
            changedFields: Object.keys(changes).join(','),
          },
        )
      }

      const result = await operation()

      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'recalculate_meal_totals',
          'calculation',
          { userId, itemId },
        )
      }

      return result
    },
    {
      userId,
      entityType: 'meal_item',
      entityId: itemId,
    },
  )
}

/**
 * Track day copying operations
 */
export async function trackDayCopy<T>(
  userId: string,
  sourceDate: string,
  targetDate: string,
  operation: () => Promise<T>,
): Promise<T> {
  return await withTransaction(
    'diet.day_copy',
    async (transactionId) => {
      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'fetch_source_day',
          'db.query',
          { userId, sourceDate },
        )
      }

      const result = await operation()

      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'create_target_day',
          'db.query',
          { userId, targetDate },
        )

        performanceManager.addSpan(
          transactionId,
          'copy_meals_and_items',
          'db.query',
          { sourceDate, targetDate },
        )
      }

      return result
    },
    {
      userId,
      entityType: 'day_copy',
      entityId: `${sourceDate}_to_${targetDate}`,
    },
  )
}

/**
 * Track comprehensive day editing sessions
 */
export async function trackDayEditSession<T>(
  userId: string,
  date: string,
  operation: () => Promise<T>,
): Promise<T> {
  return await withTransaction(
    'diet.day_edit',
    async (transactionId) => {
      if (transactionId !== null) {
        performanceManager.addSpan(transactionId, 'load_day_data', 'db.query', {
          userId,
          date,
        })

        performanceManager.addSpan(
          transactionId,
          'load_macro_targets',
          'cache.read',
          { userId },
        )
      }

      const result = await operation()

      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'save_day_changes',
          'db.query',
          { userId, date },
        )

        performanceManager.addSpan(
          transactionId,
          'update_cache',
          'cache.write',
          { userId, date },
        )
      }

      return result
    },
    {
      userId,
      entityType: 'day_diet',
      entityId: date,
    },
  )
}

/**
 * Utility to track database operations within diet transactions
 */
export function trackDietDbOperation(
  transactionId: string | null,
  operation: string,
  entityType: string,
  metadata?: Record<string, unknown>,
): void {
  if (transactionId === null) return

  performanceManager.addSpan(transactionId, operation, 'db.query', {
    entityType,
    ...metadata,
  })
}

/**
 * Utility to track API calls within diet transactions
 */
export function trackDietApiCall(
  transactionId: string | null,
  endpoint: string,
  method: string,
  metadata?: Record<string, unknown>,
): void {
  if (transactionId === null) return

  performanceManager.addSpan(
    transactionId,
    `api_${method.toLowerCase()}_${endpoint}`,
    'api.call',
    {
      endpoint,
      method,
      ...metadata,
    },
  )
}
