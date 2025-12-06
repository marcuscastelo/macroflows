import { z } from 'zod/v4'

import { dayDietSchema } from '~/modules/diet/day-diet/domain/dayDiet'
import { mealSchema } from '~/modules/diet/meal/domain/meal'
import { recipeSchema } from '~/modules/diet/recipe/domain/recipe'

/**
 * Schema version for export payloads.
 * Increment this when the schema changes to enable future migrations.
 */
export const EXPORT_SCHEMA_VERSION = '1.0.0'

/**
 * Export scope types
 */
export type ExportScope = 'meal' | 'recipe' | 'day' | 'full'

/**
 * Metadata included in every export
 */
export const exportMetadataSchema = z.object({
  schemaVersion: z.string(),
  exportedAt: z.string(),
  appVersion: z.string(),
  scope: z.enum(['meal', 'recipe', 'day', 'full']),
})

export type ExportMetadata = z.infer<typeof exportMetadataSchema>

/**
 * Export payload for a single meal
 */
export const mealExportPayloadSchema = z.object({
  metadata: exportMetadataSchema.extend({ scope: z.literal('meal') }),
  data: mealSchema,
})

export type MealExportPayload = z.infer<typeof mealExportPayloadSchema>

/**
 * Export payload for a single recipe
 */
export const recipeExportPayloadSchema = z.object({
  metadata: exportMetadataSchema.extend({ scope: z.literal('recipe') }),
  data: recipeSchema,
})

export type RecipeExportPayload = z.infer<typeof recipeExportPayloadSchema>

/**
 * Export payload for a single day
 */
export const dayExportPayloadSchema = z.object({
  metadata: exportMetadataSchema.extend({ scope: z.literal('day') }),
  data: dayDietSchema,
})

export type DayExportPayload = z.infer<typeof dayExportPayloadSchema>

/**
 * Export payload for full user data
 */
export const fullExportPayloadSchema = z.object({
  metadata: exportMetadataSchema.extend({ scope: z.literal('full') }),
  data: z.object({
    days: z.array(dayDietSchema),
    recipes: z.array(recipeSchema),
  }),
})

export type FullExportPayload = z.infer<typeof fullExportPayloadSchema>

/**
 * Union of all export payload types for validation
 */
export const exportPayloadSchema = z.union([
  mealExportPayloadSchema,
  recipeExportPayloadSchema,
  dayExportPayloadSchema,
  fullExportPayloadSchema,
])

export type ExportPayload = z.infer<typeof exportPayloadSchema>

/**
 * Type guard for MealExportPayload
 */
export function isMealExportPayload(
  payload: ExportPayload,
): payload is MealExportPayload {
  return payload.metadata.scope === 'meal'
}

/**
 * Type guard for RecipeExportPayload
 */
export function isRecipeExportPayload(
  payload: ExportPayload,
): payload is RecipeExportPayload {
  return payload.metadata.scope === 'recipe'
}

/**
 * Type guard for DayExportPayload
 */
export function isDayExportPayload(
  payload: ExportPayload,
): payload is DayExportPayload {
  return payload.metadata.scope === 'day'
}

/**
 * Type guard for FullExportPayload
 */
export function isFullExportPayload(
  payload: ExportPayload,
): payload is FullExportPayload {
  return payload.metadata.scope === 'full'
}
