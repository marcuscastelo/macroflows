import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { type Item } from '~/modules/diet/item/schema/itemSchema'
import { type Meal } from '~/modules/diet/meal/domain/meal'
import { type Recipe } from '~/modules/diet/recipe/domain/recipe'
import {
  type ExportPayload,
  isDayExportPayload,
  isFullExportPayload,
  isMealExportPayload,
  isRecipeExportPayload,
} from '~/modules/import-export/domain/exportPayload'
import { generateNumericId } from '~/shared/utils/uniqueId'

/**
 * Generates a unique ID for imported data to avoid collisions.
 */
export function generateUniqueId(): number {
  return generateNumericId()
}

/**
 * Recursively regenerates IDs for items within a parent structure.
 */
function regenerateItemIds(item: Item): Item {
  const newId = generateUniqueId()

  switch (item.reference.type) {
    case 'food':
      return {
        ...item,
        id: newId,
      }
    case 'recipe':
      return {
        ...item,
        id: newId,
        reference: {
          ...item.reference,
          children: item.reference.children.map(regenerateItemIds),
        },
      }
    case 'group':
      return {
        ...item,
        id: newId,
        reference: {
          ...item.reference,
          children: item.reference.children.map(regenerateItemIds),
        },
      }
  }
}

/**
 * Regenerates IDs for a meal and all its items.
 */
export function regenerateMealIds(meal: Meal): Meal {
  return {
    ...meal,
    id: generateUniqueId(),
    items: meal.items.map(regenerateItemIds),
  }
}

/**
 * Regenerates IDs for a recipe and all its items.
 */
export function regenerateRecipeIds(recipe: Recipe): Recipe {
  return {
    ...recipe,
    id: generateUniqueId(),
    items: recipe.items.map(regenerateItemIds),
  }
}

/**
 * Regenerates IDs for a day diet and all its meals/items.
 */
export function regenerateDayDietIds(dayDiet: DayDiet): DayDiet {
  return {
    ...dayDiet,
    id: generateUniqueId(),
    meals: dayDiet.meals.map(regenerateMealIds),
  }
}

/**
 * Regenerates IDs for an entire export payload.
 * Returns a new payload with all IDs regenerated to avoid collisions.
 */
export function regeneratePayloadIds(payload: ExportPayload): ExportPayload {
  if (isMealExportPayload(payload)) {
    return {
      metadata: payload.metadata,
      data: regenerateMealIds(payload.data),
    }
  }

  if (isRecipeExportPayload(payload)) {
    return {
      metadata: payload.metadata,
      data: regenerateRecipeIds(payload.data),
    }
  }

  if (isDayExportPayload(payload)) {
    return {
      metadata: payload.metadata,
      data: regenerateDayDietIds(payload.data),
    }
  }

  if (isFullExportPayload(payload)) {
    return {
      metadata: payload.metadata,
      data: {
        days: payload.data.days.map(regenerateDayDietIds),
        recipes: payload.data.recipes.map(regenerateRecipeIds),
      },
    }
  }

  // Fallback - should never reach here
  return payload
}
