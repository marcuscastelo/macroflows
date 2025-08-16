import { type UnifiedItem } from '~/modules/diet/unified-item/schema/unifiedItemSchema'

/**
 * Compares two arrays of UnifiedItems to detect differences
 * Used to determine if a recipe has been manually edited
 */
export function compareUnifiedItemArrays(
  originalItems: readonly UnifiedItem[],
  currentItems: readonly UnifiedItem[],
): boolean {
  // If lengths are different, items were added/removed
  if (originalItems.length !== currentItems.length) {
    return false
  }

  // Compare each item by sorting both arrays by ID first to handle reordering
  const sortById = (items: readonly UnifiedItem[]) =>
    [...items].sort((a, b) => a.id - b.id)

  const sortedOriginal = sortById(originalItems)
  const sortedCurrent = sortById(currentItems)

  for (let i = 0; i < sortedOriginal.length; i++) {
    const original = sortedOriginal[i]!
    const current = sortedCurrent[i]!

    // Compare essential properties that indicate manual editing
    if (
      original.id !== current.id ||
      original.name !== current.name ||
      original.quantity !== current.quantity ||
      original.reference.type !== current.reference.type
    ) {
      return false
    }

    // For food items, compare macros
    if (
      original.reference.type === 'food' &&
      current.reference.type === 'food'
    ) {
      const originalMacros = original.reference.macros
      const currentMacros = current.reference.macros

      if (
        originalMacros.protein !== currentMacros.protein ||
        originalMacros.carbs !== currentMacros.carbs ||
        originalMacros.fat !== currentMacros.fat
      ) {
        return false
      }
    }

    // For recipe and group items, recursively compare children
    if (
      (original.reference.type === 'recipe' &&
        current.reference.type === 'recipe') ||
      (original.reference.type === 'group' &&
        current.reference.type === 'group')
    ) {
      if (
        !compareUnifiedItemArrays(
          original.reference.children,
          current.reference.children,
        )
      ) {
        return false
      }
    }
  }

  return true
}

/**
 * Synchronizes a RecipeItem with its original recipe by replacing
 * the current children with the original recipe items
 */
export function synchronizeRecipeItemWithOriginal(
  recipeItem: UnifiedItem,
  originalRecipeItems: readonly UnifiedItem[],
): UnifiedItem {
  if (recipeItem.reference.type !== 'recipe') {
    throw new Error('Can only synchronize recipe items')
  }

  // Use original items directly - no need to regenerate IDs
  const syncedChildren = [...originalRecipeItems]

  // Calculate total quantity from synchronized children to maintain consistency
  const totalQuantity = syncedChildren.reduce(
    (sum, child) => sum + child.quantity,
    0,
  )

  return {
    ...recipeItem,
    quantity: totalQuantity,
    reference: {
      ...recipeItem.reference,
      children: syncedChildren,
    },
  }
}

/**
 * Scales a RecipeItem by changing its quantity and proportionally scaling all children
 * Used when user changes the total quantity of a recipe item
 */
export function scaleRecipeItemQuantity(
  recipeItem: UnifiedItem,
  newQuantity: number,
): UnifiedItem {
  if (recipeItem.reference.type !== 'recipe') {
    throw new Error('Can only scale recipe items')
  }

  if (newQuantity <= 0) {
    throw new Error('New quantity must be greater than 0')
  }

  const currentQuantity = recipeItem.quantity
  if (currentQuantity <= 0) {
    throw new Error('Current quantity must be greater than 0')
  }

  const scalingFactor = newQuantity / currentQuantity

  // Scale all children proportionally with minimum values
  const scaledChildren = recipeItem.reference.children.map((child) => {
    const scaledQuantity = child.quantity * scalingFactor
    const roundedQuantity = Math.round(scaledQuantity * 10000) / 10000 // Round to 4 decimal places

    // Ensure minimum quantity of 0.0001g for ingredients to prevent zero-lock
    const finalQuantity = Math.max(roundedQuantity, 0.0001)

    return {
      ...child,
      quantity: finalQuantity,
    }
  })

  // Ensure minimum quantity of 0.01g for main item
  const finalMainQuantity = Math.max(Math.round(newQuantity * 100) / 100, 0.01)

  return {
    ...recipeItem,
    quantity: finalMainQuantity,
    reference: {
      ...recipeItem.reference,
      children: scaledChildren,
    },
  }
}
