import {
  performanceManager,
  withTransaction,
} from '~/shared/config/performance'

/**
 * Profile Management Transaction Wrappers
 *
 * These functions wrap major profile-related user flows with performance tracking
 */

/**
 * Track macro target updates
 */
export async function trackMacroTargetUpdate<T>(
  userId: string,
  targets: {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
  },
  operation: () => Promise<T>,
): Promise<T> {
  return await withTransaction(
    'profile.update_macro_targets',
    async (transactionId) => {
      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'validate_macro_targets',
          'validation',
          {
            userId,
            hasCalories: Boolean(targets.calories),
            hasProtein: Boolean(targets.protein),
            hasCarbs: Boolean(targets.carbs),
            hasFat: Boolean(targets.fat),
            totalCalories: targets.calories ?? 0,
          },
        )

        performanceManager.addSpan(
          transactionId,
          'calculate_macro_ratios',
          'calculation',
          {
            proteinRatio:
              targets.protein !== undefined && targets.calories !== undefined
                ? (targets.protein * 4) / targets.calories
                : 0,
            carbRatio:
              targets.carbs !== undefined && targets.calories !== undefined
                ? (targets.carbs * 4) / targets.calories
                : 0,
            fatRatio:
              targets.fat !== undefined && targets.calories !== undefined
                ? (targets.fat * 9) / targets.calories
                : 0,
          },
        )
      }

      const result = await operation()

      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'save_macro_targets',
          'db.query',
          { userId, ...targets },
        )

        performanceManager.addSpan(
          transactionId,
          'update_profile_cache',
          'cache.write',
          { userId },
        )

        performanceManager.addSpan(
          transactionId,
          'invalidate_day_caches',
          'cache.write',
          { userId },
        )
      }

      return result
    },
    {
      userId,
      entityType: 'macro_targets',
      entityId: userId,
    },
  )
}

/**
 * Track user preferences updates
 */
export async function trackPreferencesUpdate<T>(
  userId: string,
  preferences: Record<string, unknown>,
  operation: () => Promise<T>,
): Promise<T> {
  return await withTransaction(
    'profile.update_preferences',
    async (transactionId) => {
      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'validate_preferences',
          'validation',
          {
            userId,
            preferencesCount: Object.keys(preferences).length,
            changedFields: Object.keys(preferences).join(','),
          },
        )

        performanceManager.addSpan(
          transactionId,
          'fetch_current_preferences',
          'db.query',
          { userId },
        )
      }

      const result = await operation()

      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'save_user_preferences',
          'db.query',
          { userId, preferencesCount: Object.keys(preferences).length },
        )

        performanceManager.addSpan(
          transactionId,
          'update_preferences_cache',
          'cache.write',
          { userId },
        )
      }

      return result
    },
    {
      userId,
      entityType: 'user_preferences',
      entityId: userId,
      itemCount: Object.keys(preferences).length,
    },
  )
}

/**
 * Track data export operations
 */
export async function trackDataExport<T>(
  userId: string,
  exportType: 'all' | 'diet' | 'weight' | 'recipes',
  operation: () => Promise<T>,
  dateRange?: { startDate: string; endDate: string },
): Promise<T> {
  return await withTransaction(
    'profile.export_data',
    async (transactionId) => {
      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'validate_export_request',
          'validation',
          {
            userId,
            exportType,
            hasDateRange: Boolean(dateRange),
            startDate: dateRange?.startDate,
            endDate: dateRange?.endDate,
          },
        )

        if (dateRange) {
          performanceManager.addSpan(
            transactionId,
            'calculate_export_scope',
            'calculation',
            {
              daySpan: Math.ceil(
                (new Date(dateRange.endDate).getTime() -
                  new Date(dateRange.startDate).getTime()) /
                  (1000 * 60 * 60 * 24),
              ),
              exportType,
            },
          )
        }
      }

      const result = await operation()

      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'fetch_export_data',
          'db.query',
          { userId, exportType, ...dateRange },
        )

        performanceManager.addSpan(
          transactionId,
          'format_export_data',
          'calculation',
          { userId, exportType },
        )

        performanceManager.addSpan(
          transactionId,
          'generate_export_file',
          'calculation',
          { userId, exportType },
        )
      }

      return result
    },
    {
      userId,
      entityType: 'data_export',
      entityId: `${exportType}_${dateRange?.startDate ?? 'all'}_${dateRange?.endDate ?? 'all'}`,
    },
  )
}

/**
 * Track profile data loading operations
 */
export async function trackProfileDataLoad<T>(
  userId: string,
  dataTypes: string[],
  operation: () => Promise<T>,
): Promise<T> {
  return await withTransaction(
    'profile.update_preferences', // Reuse preferences transaction type
    async (transactionId) => {
      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'check_profile_cache',
          'cache.read',
          { userId, dataTypes: dataTypes.join(',') },
        )

        dataTypes.forEach((dataType) => {
          performanceManager.addSpan(
            transactionId,
            `load_${dataType}_data`,
            'db.query',
            { userId, dataType },
          )
        })
      }

      const result = await operation()

      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'cache_profile_data',
          'cache.write',
          { userId, dataTypes: dataTypes.join(',') },
        )
      }

      return result
    },
    {
      userId,
      entityType: 'profile_data_load',
      itemCount: dataTypes.length,
    },
  )
}

/**
 * Track user onboarding operations
 */
export async function trackUserOnboarding<T>(
  userId: string,
  onboardingStep: string,
  stepData: Record<string, unknown>,
  operation: () => Promise<T>,
): Promise<T> {
  return await withTransaction(
    'profile.update_preferences',
    async (transactionId) => {
      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'validate_onboarding_step',
          'validation',
          {
            userId,
            onboardingStep,
            stepDataFields: Object.keys(stepData).join(','),
          },
        )

        performanceManager.addSpan(
          transactionId,
          'track_onboarding_progress',
          'calculation',
          { userId, onboardingStep },
        )
      }

      const result = await operation()

      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'save_onboarding_data',
          'db.query',
          { userId, onboardingStep },
        )

        performanceManager.addSpan(
          transactionId,
          'update_user_profile',
          'db.query',
          { userId },
        )
      }

      return result
    },
    {
      userId,
      entityType: 'user_onboarding',
      entityId: onboardingStep,
    },
  )
}

/**
 * Utility to track profile calculation operations
 */
export function trackProfileCalculation(
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
 * Utility to track profile database operations
 */
export function trackProfileDbOperation(
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
