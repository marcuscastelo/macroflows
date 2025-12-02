import {
  isFoodItem,
  isGroupItem,
  isRecipeItem,
  type Item,
} from '~/modules/diet/item/schema/itemSchema'
import { type RecentFood } from '~/modules/recent-food/domain/recentFood'

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
 * For GroupItem: returns the reference of the first trackable child (food or recipe)
 *
 * @param item - The item to extract reference from
 * @returns The recent food reference, or null if the item cannot be tracked
 */
export function extractRecentFoodReference(
  item: Item,
): RecentFoodReference | null {
  if (isFoodItem(item)) {
    return {
      type: 'food',
      referenceId: item.reference.id,
    }
  }

  if (isRecipeItem(item)) {
    return {
      type: 'recipe',
      referenceId: item.reference.id,
    }
  }

  if (isGroupItem(item)) {
    // GroupItem: track using the first trackable child's reference
    const firstChild = item.reference.children[0]
    if (firstChild !== undefined && isFoodItem(firstChild)) {
      return {
        type: 'food',
        referenceId: firstChild.reference.id,
      }
    }
    if (firstChild !== undefined && isRecipeItem(firstChild)) {
      return {
        type: 'recipe',
        referenceId: firstChild.reference.id,
      }
    }
    // Cannot track - no trackable children
    return null
  }

  // Unknown item type (should never happen due to exhaustive checks)
  return null
}
