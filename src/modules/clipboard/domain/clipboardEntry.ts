import { z } from 'zod/v4'

import { type Item, itemSchema } from '~/modules/diet/item/schema/itemSchema'
import { type Meal, mealSchema } from '~/modules/diet/meal/domain/meal'
import { type Recipe, recipeSchema } from '~/modules/diet/recipe/domain/recipe'

/**
 * Discriminated union for clipboard payload types
 */
export const clipboardPayloadSchema = z.union([
  itemSchema,
  mealSchema,
  recipeSchema,
])

export type ClipboardPayload = z.infer<typeof clipboardPayloadSchema>

export const clipboardEntrySchema = z.object({
  id: z.string(),
  payload: clipboardPayloadSchema,
  createdAt: z.number(),
  pinned: z.boolean().default(false),
})

export type ClipboardEntry = z.infer<typeof clipboardEntrySchema>

export function isItemPayload(payload: ClipboardPayload): payload is Item {
  return payload.__type === 'UnifiedItem'
}

export function isMealPayload(payload: ClipboardPayload): payload is Meal {
  return payload.__type === 'Meal'
}

export function isRecipePayload(payload: ClipboardPayload): payload is Recipe {
  return payload.__type === 'Recipe'
}

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
