import { APP_VERSION } from '~/app-version'
import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { type Meal } from '~/modules/diet/meal/domain/meal'
import { type Recipe } from '~/modules/diet/recipe/domain/recipe'
import {
  type DayExportPayload,
  EXPORT_SCHEMA_VERSION,
  type ExportPayload,
  type FullExportPayload,
  type MealExportPayload,
  type RecipeExportPayload,
} from '~/modules/import-export/domain/exportPayload'

/**
 * Creates the base metadata for an export payload.
 */
function createBaseMetadata() {
  return {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
  } as const
}

/**
 * Creates an export payload for a meal.
 */
export function createMealExport(meal: Meal): MealExportPayload {
  return {
    metadata: {
      ...createBaseMetadata(),
      scope: 'meal' as const,
    },
    data: meal,
  }
}

/**
 * Creates an export payload for a recipe.
 */
export function createRecipeExport(recipe: Recipe): RecipeExportPayload {
  return {
    metadata: {
      ...createBaseMetadata(),
      scope: 'recipe' as const,
    },
    data: recipe,
  }
}

/**
 * Creates an export payload for a day's diet.
 */
export function createDayExport(dayDiet: DayDiet): DayExportPayload {
  return {
    metadata: {
      ...createBaseMetadata(),
      scope: 'day' as const,
    },
    data: dayDiet,
  }
}

/**
 * Creates a full export payload with all days and recipes.
 */
export function createFullExport(
  days: DayDiet[],
  recipes: Recipe[],
): FullExportPayload {
  return {
    metadata: {
      ...createBaseMetadata(),
      scope: 'full' as const,
    },
    data: {
      days,
      recipes,
    },
  }
}

/**
 * Downloads an export payload as a JSON file.
 */
export function downloadExport(payload: ExportPayload, filename?: string) {
  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const defaultFilename = `macroflows-${payload.metadata.scope}-${new Date().toISOString().split('T')[0]}.json`
  const finalFilename = filename ?? defaultFilename

  const link = document.createElement('a')
  link.href = url
  link.download = finalFilename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
