import { type ClipboardPayload } from '~/modules/clipboard/domain/clipboardEntry'
import { type Meal } from '~/modules/diet/meal/domain/meal'
import { type Recipe } from '~/modules/diet/recipe/domain/recipe'
import { type UnifiedItem } from '~/modules/diet/unified-item/schema/unifiedItemSchema'

/**
 * Helper functions to create clipboard payloads from domain types
 */

export function createUnifiedItemPayload(item: UnifiedItem): ClipboardPayload {
  return {
    __type: 'UnifiedItem',
    value: item,
  }
}

export function createMealPayload(meal: Meal): ClipboardPayload {
  return {
    __type: 'Meal',
    value: meal,
  }
}

export function createRecipePayload(recipe: Recipe): ClipboardPayload {
  return {
    __type: 'Recipe',
    value: recipe,
  }
}
