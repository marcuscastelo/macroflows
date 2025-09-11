import {
  performanceManager,
  withUserFlowSpan,
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
  return await withUserFlowSpan(
    'profile.update_macro_targets',
    async (spanId) => {
      if (spanId !== null) {
        performanceManager.addSpanAttributes(
          spanId,
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

        performanceManager.addSpanAttributes(
          spanId,
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

      if (spanId !== null) {
        performanceManager.addSpanAttributes(
          spanId,
          'save_macro_targets',
          'db.query',
          { userId, ...targets },
        )

        performanceManager.addSpanAttributes(
          spanId,
          'update_profile_cache',
          'cache.write',
          { userId },
        )

        performanceManager.addSpanAttributes(
          spanId,
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
  return await withUserFlowSpan(
    'profile.update_preferences',
    async (spanId) => {
      if (spanId !== null) {
        performanceManager.addSpanAttributes(
          spanId,
          'validate_preferences',
          'validation',
          {
            userId,
            preferencesCount: Object.keys(preferences).length,
            changedFields: Object.keys(preferences).join(','),
          },
        )

        performanceManager.addSpanAttributes(
          spanId,
          'fetch_current_preferences',
          'db.query',
          { userId },
        )
      }

      const result = await operation()

      if (spanId !== null) {
        performanceManager.addSpanAttributes(
          spanId,
          'save_user_preferences',
          'db.query',
          { userId, preferencesCount: Object.keys(preferences).length },
        )

        performanceManager.addSpanAttributes(
          spanId,
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
  return await withUserFlowSpan(
    'profile.export_data',
    async (spanId) => {
      if (spanId !== null) {
        performanceManager.addSpanAttributes(
          spanId,
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
          performanceManager.addSpanAttributes(
            spanId,
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

      if (spanId !== null) {
        performanceManager.addSpanAttributes(
          spanId,
          'fetch_export_data',
          'db.query',
          { userId, exportType, ...dateRange },
        )

        performanceManager.addSpanAttributes(
          spanId,
          'format_export_data',
          'calculation',
          { userId, exportType },
        )

        performanceManager.addSpanAttributes(
          spanId,
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
  return await withUserFlowSpan(
    'profile.update_preferences', // Reuse preferences transaction type
    async (spanId) => {
      if (spanId !== null) {
        performanceManager.addSpanAttributes(
          spanId,
          'check_profile_cache',
          'cache.read',
          { userId, dataTypes: dataTypes.join(',') },
        )

        dataTypes.forEach((dataType) => {
          performanceManager.addSpanAttributes(
            spanId,
            `load_${dataType}_data`,
            'db.query',
            { userId, dataType },
          )
        })
      }

      const result = await operation()

      if (spanId !== null) {
        performanceManager.addSpanAttributes(
          spanId,
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
  return await withUserFlowSpan(
    'profile.update_preferences',
    async (spanId) => {
      if (spanId !== null) {
        performanceManager.addSpanAttributes(
          spanId,
          'validate_onboarding_step',
          'validation',
          {
            userId,
            onboardingStep,
            stepDataFields: Object.keys(stepData).join(','),
          },
        )

        performanceManager.addSpanAttributes(
          spanId,
          'track_onboarding_progress',
          'calculation',
          { userId, onboardingStep },
        )
      }

      const result = await operation()

      if (spanId !== null) {
        performanceManager.addSpanAttributes(
          spanId,
          'save_onboarding_data',
          'db.query',
          { userId, onboardingStep },
        )

        performanceManager.addSpanAttributes(
          spanId,
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
 * Utility to track profile database operations
 */
export function trackProfileDbOperation(
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
