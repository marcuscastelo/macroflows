import { metrics } from '@opentelemetry/api'

export type MetricType = 'counter' | 'gauge' | 'histogram'

export type MetricAttributes = Record<string, string | number | boolean>

export type BusinessMetric = {
  name: string
  type: MetricType
  description: string
  unit?: string
}

const meter = metrics.getMeter('macroflows-nutrition', '1.0.0')

export const nutritionMetrics = {
  macroCalculation: meter.createHistogram('nutrition.macro.calculation.duration', {
    description: 'Duration of macro nutrient calculations',
    unit: 'ms',
  }),

  mealCompletion: meter.createCounter('nutrition.meal.completion', {
    description: 'Number of completed meal logs',
    unit: 'meals',
  }),

  mealCreation: meter.createCounter('nutrition.meal.created', {
    description: 'Number of meals created',
    unit: 'meals',
  }),

  dayDietCreation: meter.createCounter('nutrition.day.created', {
    description: 'Number of diet days created',
    unit: 'days',
  }),

  macroTotals: {
    carbs: meter.createHistogram('nutrition.macro.carbs.total', {
      description: 'Total carbohydrates tracked',
      unit: 'g',
    }),
    protein: meter.createHistogram('nutrition.macro.protein.total', {
      description: 'Total protein tracked',
      unit: 'g',
    }),
    fat: meter.createHistogram('nutrition.macro.fat.total', {
      description: 'Total fat tracked',
      unit: 'g',
    }),
  },

  searchDuration: meter.createHistogram('nutrition.search.duration', {
    description: 'Duration of food search operations',
    unit: 'ms',
  }),

  eanScanDuration: meter.createHistogram('nutrition.ean.scan.duration', {
    description: 'Duration of EAN barcode scanning',
    unit: 'ms',
  }),

  eanScanSuccess: meter.createCounter('nutrition.ean.scan.success', {
    description: 'Number of successful EAN scans',
    unit: 'scans',
  }),

  eanScanFailure: meter.createCounter('nutrition.ean.scan.failure', {
    description: 'Number of failed EAN scans',
    unit: 'scans',
  }),

  recipeCalculationDuration: meter.createHistogram(
    'nutrition.recipe.calculation.duration',
    {
      description: 'Duration of recipe macro calculations',
      unit: 'ms',
    },
  ),

  sessionDuration: meter.createHistogram('user.session.duration', {
    description: 'User session duration',
    unit: 'ms',
  }),

  featureUsage: meter.createCounter('user.feature.usage', {
    description: 'Feature usage count by type',
    unit: 'interactions',
  }),

  dailyActiveUsers: meter.createCounter('user.daily.active', {
    description: 'Daily active users',
    unit: 'users',
  }),

  mealsPerSession: meter.createHistogram('user.session.meals', {
    description: 'Number of meals logged per session',
    unit: 'meals',
  }),

  itemAddedToMeal: meter.createCounter('nutrition.meal.item.added', {
    description: 'Number of items added to meals',
    unit: 'items',
  }),

  foodCreated: meter.createCounter('nutrition.food.created', {
    description: 'Number of custom foods created',
    unit: 'foods',
  }),

  recipeCreated: meter.createCounter('nutrition.recipe.created', {
    description: 'Number of recipes created',
    unit: 'recipes',
  }),
}

export function recordMacroCalculation(
  durationMs: number,
  attributes?: MetricAttributes,
) {
  nutritionMetrics.macroCalculation.record(durationMs, attributes)
}

export function recordMealCompletion(attributes?: MetricAttributes) {
  nutritionMetrics.mealCompletion.add(1, attributes)
}

export function recordMealCreation(attributes?: MetricAttributes) {
  nutritionMetrics.mealCreation.add(1, attributes)
}

export function recordDayDietCreation(attributes?: MetricAttributes) {
  nutritionMetrics.dayDietCreation.add(1, attributes)
}

export function recordMacroTotals(
  carbs: number,
  protein: number,
  fat: number,
  attributes?: MetricAttributes,
) {
  nutritionMetrics.macroTotals.carbs.record(carbs, attributes)
  nutritionMetrics.macroTotals.protein.record(protein, attributes)
  nutritionMetrics.macroTotals.fat.record(fat, attributes)
}

export function recordSearchDuration(
  durationMs: number,
  attributes?: MetricAttributes,
) {
  nutritionMetrics.searchDuration.record(durationMs, attributes)
}

export function recordEanScan(
  success: boolean,
  durationMs: number,
  attributes?: MetricAttributes,
) {
  if (success) {
    nutritionMetrics.eanScanSuccess.add(1, attributes)
  } else {
    nutritionMetrics.eanScanFailure.add(1, attributes)
  }
  nutritionMetrics.eanScanDuration.record(durationMs, attributes)
}

export function recordRecipeCalculation(
  durationMs: number,
  attributes?: MetricAttributes,
) {
  nutritionMetrics.recipeCalculationDuration.record(durationMs, attributes)
}

export function recordSessionDuration(
  durationMs: number,
  attributes?: MetricAttributes,
) {
  nutritionMetrics.sessionDuration.record(durationMs, attributes)
}

export function recordFeatureUsage(
  featureName: string,
  attributes?: MetricAttributes,
) {
  nutritionMetrics.featureUsage.add(1, {
    ...attributes,
    feature: featureName,
  })
}

export function recordDailyActiveUser(userId: string) {
  nutritionMetrics.dailyActiveUsers.add(1, {
    userId,
    date: new Date().toISOString().split('T')[0],
  })
}

export function recordMealsPerSession(
  mealCount: number,
  attributes?: MetricAttributes,
) {
  nutritionMetrics.mealsPerSession.record(mealCount, attributes)
}

export function recordItemAddedToMeal(attributes?: MetricAttributes) {
  nutritionMetrics.itemAddedToMeal.add(1, attributes)
}

export function recordFoodCreated(attributes?: MetricAttributes) {
  nutritionMetrics.foodCreated.add(1, attributes)
}

export function recordRecipeCreated(attributes?: MetricAttributes) {
  nutritionMetrics.recipeCreated.add(1, attributes)
}

export function withPerformanceMetric<T>(
  metricRecorder: (duration: number, attributes?: MetricAttributes) => void,
  attributes?: MetricAttributes,
) {
  return async (operation: () => Promise<T>): Promise<T> => {
    const start = performance.now()
    try {
      const result = await operation()
      const duration = performance.now() - start
      metricRecorder(duration, attributes)
      return result
    } catch (error) {
      const duration = performance.now() - start
      metricRecorder(duration, { ...attributes, error: true })
      throw error
    }
  }
}

export function measureSync<T>(
  operation: () => T,
  metricRecorder: (duration: number, attributes?: MetricAttributes) => void,
  attributes?: MetricAttributes,
): T {
  const start = performance.now()
  try {
    const result = operation()
    const duration = performance.now() - start
    metricRecorder(duration, attributes)
    return result
  } catch (error) {
    const duration = performance.now() - start
    metricRecorder(duration, { ...attributes, error: true })
    throw error
  }
}
