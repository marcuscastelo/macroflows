import { z } from 'zod/v4'

import { mealSchema } from '~/modules/diet/meal/domain/meal'
import { recipeSchema } from '~/modules/diet/recipe/domain/recipe'
import { unifiedItemSchema } from '~/modules/diet/unified-item/schema/unifiedItemSchema'

/**
 * Discriminated union for clipboard payload types
 */
export const clipboardPayloadSchema = z.union([
  unifiedItemSchema,
  mealSchema,
  recipeSchema,
])

export type ClipboardPayload = z.infer<typeof clipboardPayloadSchema>

/**
 * Clipboard entry with metadata
 */
export const clipboardEntrySchema = z.object({
  id: z.string(),
  payload: clipboardPayloadSchema,
  createdAt: z.number(),
  pinned: z.boolean().default(false),
})

export type ClipboardEntry = z.infer<typeof clipboardEntrySchema>

/**
 * Type guards for clipboard payloads
 */
export function isUnifiedItemPayload(
  payload: ClipboardPayload,
): payload is Extract<ClipboardPayload, { __type: 'UnifiedItem' }> {
  return payload.__type === 'UnifiedItem'
}

export function isMealPayload(
  payload: ClipboardPayload,
): payload is Extract<ClipboardPayload, { __type: 'Meal' }> {
  return payload.__type === 'Meal'
}

export function isRecipePayload(
  payload: ClipboardPayload,
): payload is Extract<ClipboardPayload, { __type: 'Recipe' }> {
  return payload.__type === 'Recipe'
}

/**
 * Create a new clipboard entry
 */
export function createClipboardEntry(
  payload: ClipboardPayload,
  options?: { pinned?: boolean },
): ClipboardEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    payload,
    createdAt: Date.now(),
    pinned: options?.pinned ?? false,
  }
}
