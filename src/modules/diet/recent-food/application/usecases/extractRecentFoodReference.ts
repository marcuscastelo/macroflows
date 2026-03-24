import {
  isFoodItem,
  isGroupItem,
  isRecipeItem,
  type Item,
} from '~/modules/diet/item/schema/itemSchema'
import { type RecentFood } from '~/modules/diet/recent-food/domain/recentFood'
import { templateToItem } from '~/modules/diet/template/application/templateToItem'
import { type Template } from '~/modules/diet/template/domain/template'

/**
 * Result of extracting recent food reference from an item.
 */
export type RecentFoodReference = {
  type: RecentFood['type']
  referenceId: number
}

/**
 * Extracts the recent food reference (type and referenceId) from an item.
 * This is used to track recently used foods/recipes.
 *
 * For FoodItem: returns the food reference directly
 * For RecipeItem: returns the recipe reference directly
 * For GroupItem: returns references for all trackable children (foods and recipes)
 *
 * @param item - The item to extract reference from
 * @returns An array of recent food references, or an empty array if the item cannot be tracked
 */
export function extractRecentFoodReferenceFromItem(
  item: Item,
): RecentFoodReference[] {
  if (isFoodItem(item)) {
    return [
      {
        type: item.reference.type,
        referenceId: item.reference.id,
      },
    ]
  }

  if (isRecipeItem(item)) {
    return [
      {
        type: item.reference.type,
        referenceId: item.reference.id,
      },
    ]
  }

  if (isGroupItem(item)) {
    const references: RecentFoodReference[] = []
    for (const child of item.reference.children) {
      const childReferences = extractRecentFoodReferenceFromItem(child)
      if (childReferences.length > 0) {
        references.push(...childReferences)
      }
    }
    return references
  }

  // Should never reach here
  item satisfies never
  return []
}

export function extractRecentFoodReferenceFromTemplate(
  template: Template,
): RecentFoodReference[] {
  return extractRecentFoodReferenceFromItem(templateToItem(template))
}
