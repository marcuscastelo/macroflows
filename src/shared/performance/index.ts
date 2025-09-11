/**
 * Custom Transaction Performance Monitoring
 *
 * This module provides comprehensive transaction tracking for major user flows
 * in the Macroflows application. It integrates with Sentry Performance monitoring
 * to provide detailed observability into user interactions and system performance.
 *
 * Major User Flows Covered:
 * - Diet Management (day creation, meal editing, item operations)
 * - Food Search (name search, barcode scanning, selection)
 * - Recipe Management (CRUD operations, meal addition)
 * - Weight Tracking (entry recording, history viewing)
 * - Authentication (login, logout, registration)
 * - Profile Management (preferences, macro targets, data export)
 */

// Core performance monitoring
export {
  performanceManager,
  type SpanType,
  type UserFlowContext,
  type UserFlowOperation,
  type UserFlowType,
  withUserFlowSpan,
} from '~/shared/config/performance'

// Diet Management Transactions
export {
  trackDayCopy,
  trackDayCreation,
  trackDayEditSession,
  trackDietApiCall,
  trackDietDbOperation,
  trackMealItemAddition,
  trackMealItemEdit,
} from '~/shared/performance/dietTransactions'

// Food Search Transactions
export {
  trackBarcodeSearch,
  trackFoodApiFetch,
  trackFoodSearch,
  trackFoodSelection,
  trackSearchCache,
  trackSearchMetrics,
  trackSearchSession,
} from '~/shared/performance/searchTransactions'

// Recipe Management Transactions
export {
  trackRecipeAddToMeal,
  trackRecipeCalculation,
  trackRecipeCreation,
  trackRecipeDbOperation,
  trackRecipeDeletion,
  trackRecipeDuplication,
  trackRecipeEdit,
  trackRecipeSearch,
} from '~/shared/performance/recipeTransactions'

// Weight Tracking Transactions
export {
  trackWeightCalculation,
  trackWeightChartRender,
  trackWeightDbOperation,
  trackWeightDeletion,
  trackWeightEdit,
  trackWeightEntry,
  trackWeightHistoryView,
  trackWeightStatsCalculation,
} from '~/shared/performance/weightTransactions'

// Authentication Transactions
export {
  trackAuthApiCall,
  trackAuthCache,
  trackPasswordReset,
  trackSessionValidation,
  trackUserLogin,
  trackUserLogout,
  trackUserRegistration,
} from '~/shared/performance/authTransactions'

// Profile Management Transactions
export {
  trackDataExport,
  trackMacroTargetUpdate,
  trackPreferencesUpdate,
  trackProfileCalculation,
  trackProfileDataLoad,
  trackProfileDbOperation,
  trackUserOnboarding,
} from '~/shared/performance/profileTransactions'
