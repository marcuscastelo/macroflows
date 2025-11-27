import {
  isGroupItem,
  isRecipeItem,
  type Item,
} from '~/modules/diet/item/schema/itemSchema'

/** Maximum length for item names */
export const MAX_ITEM_NAME_LENGTH = 100

/**
 * Validates if an item name is valid (non-empty after trimming whitespace)
 * @param name The name to validate
 * @returns true if the name is valid
 */
export function isItemNameValid(name: string): boolean {
  return name.trim().length > 0
}

/**
 * Truncates a name to the maximum allowed length
 * @param name The name to truncate
 * @returns The truncated name
 */
export function truncateItemName(name: string): string {
  return name.slice(0, MAX_ITEM_NAME_LENGTH)
}

/**
 * Validates if an item can be applied/saved based on its properties.
 * Checks quantity and name validity for parent items.
 * @param item The item to validate
 * @returns true if the item is valid and can be applied
 */
export function canApplyItem(item: Item): boolean {
  // Check quantity is valid
  if (item.quantity <= 0) return false

  // For parent items (GroupItem/RecipeItem), also check name is not empty
  if (isGroupItem(item) || isRecipeItem(item)) {
    if (!isItemNameValid(item.name)) return false
  }

  return true
}
