import {
  isFoodItem,
  isGroupItem,
  isRecipeItem,
  type UnifiedItem,
} from '~/modules/diet/unified-item/schema/unifiedItemSchema'

/**
 * Removes a child by id from a UnifiedItem (recipe or group).
 */
export function removeChildFromItem(
  item: UnifiedItem,
  childId: number,
): UnifiedItem {
  if (
    (item.reference.type === 'recipe' || item.reference.type === 'group') &&
    Array.isArray(item.reference.children)
  ) {
    if (isFoodItem(item)) {
      throw new Error('Cannot remove child from food item')
    } else if (isRecipeItem(item)) {
      return {
        ...item,
        reference: {
          ...item.reference,
          children: item.reference.children.filter((c) => c.id !== childId),
        },
      }
    } else if (isGroupItem(item)) {
      return {
        ...item,
        reference: {
          ...item.reference,
          children: item.reference.children.filter((c) => c.id !== childId),
        },
      }
    }
  }
  return item
}

/**
 * Updates a child by id in a UnifiedItem (recipe or group).
 */
export function updateChildInItem(
  item: UnifiedItem,
  childId: number,
  updates: Partial<Pick<UnifiedItem, 'id' | 'name' | 'quantity'>>,
): UnifiedItem {
  if (
    (item.reference.type === 'recipe' || item.reference.type === 'group') &&
    Array.isArray(item.reference.children)
  ) {
    if (isFoodItem(item)) {
      throw new Error('Cannot update child in food item')
    } else if (isRecipeItem(item)) {
      return {
        ...item,
        reference: {
          ...item.reference,
          children: item.reference.children.map((c) =>
            c.id === childId ? updateUnifiedItem(c, updates) : c,
          ),
        },
      }
    } else if (isGroupItem(item)) {
      return {
        ...item,
        reference: {
          ...item.reference,
          children: item.reference.children.map((c) =>
            c.id === childId ? updateUnifiedItem(c, updates) : c,
          ),
        },
      }
    }
  }
  return item
}

/**
 * Helper function to update a UnifiedItem with partial updates
 */
function updateUnifiedItem(
  item: UnifiedItem,
  updates: Partial<Pick<UnifiedItem, 'id' | 'name' | 'quantity'>>,
): UnifiedItem {
  if (isFoodItem(item)) {
    return {
      ...item,
      ...updates,
    }
  } else if (isRecipeItem(item)) {
    return {
      ...item,
      ...updates,
    }
  } else if (isGroupItem(item)) {
    return {
      ...item,
      ...updates,
    }
  }

  throw new Error('Invalid UnifiedItem type')
}
