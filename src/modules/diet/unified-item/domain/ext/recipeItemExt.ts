import { ItemExt } from '~/modules/diet/unified-item/domain/ext/itemExt'
import {
  type RecipeItem,
  type UnifiedItem,
} from '~/modules/diet/unified-item/schema/unifiedItemSchema'

export const RecipeItemExt = {
  syncWithOriginal(
    recipeItem: RecipeItem,
    originalRecipeItems: readonly UnifiedItem[],
  ): RecipeItem {
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
  },

  scaleQuantityAndChildren(
    recipeItem: RecipeItem,
    newQuantity: number,
  ): RecipeItem {
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
    const finalMainQuantity = Math.max(
      Math.round(newQuantity * 100) / 100,
      0.01,
    )

    return {
      ...recipeItem,
      quantity: finalMainQuantity,
      reference: {
        ...recipeItem.reference,
        children: scaledChildren,
      },
    }
  },

  of(item: RecipeItem) {
    const itemExt = ItemExt.of(item)
    return {
      ...itemExt,
      value: item,
      syncWithOriginal: (originalRecipeItems: readonly UnifiedItem[]) =>
        RecipeItemExt.syncWithOriginal(item, originalRecipeItems),
      scaleQuantityAndChildren: (newQuantity: number) =>
        RecipeItemExt.scaleQuantityAndChildren(item, newQuantity),
    }
  },
}
