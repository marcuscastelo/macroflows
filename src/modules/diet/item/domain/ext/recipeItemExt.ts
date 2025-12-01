import { ItemExt } from '~/modules/diet/item/domain/ext/itemExt'
import { Items } from '~/modules/diet/item/domain/ext/itemsExt'
import {
  type Item,
  type RecipeItem,
} from '~/modules/diet/item/schema/itemSchema'
import { type Recipe } from '~/modules/diet/recipe/domain/recipe'

export const RecipeItemExt = {
  syncWithOriginal(
    recipeItem: RecipeItem,
    originalRecipeItems: readonly Item[],
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
    recipe: Recipe,
    newQuantity: number,
  ): RecipeItem {
    if (newQuantity <= 0) {
      throw new Error('New quantity must be greater than 0')
    }

    const mainQuantity = Math.max(0.01, Math.round(newQuantity * 100) / 100)
    const totalChildQuantity = mainQuantity / recipe.prepared_multiplier

    const normalizedChildren = Items.normalizedQuantitiesShallow(
      recipeItem.reference.children,
    )

    const scaledChildren = normalizedChildren.map((normalizedChild) => ({
      ...normalizedChild,
      quantity:
        Math.round(totalChildQuantity * normalizedChild.quantity * 100) / 100,
    }))

    return {
      ...recipeItem,
      quantity: mainQuantity,
      reference: {
        ...recipeItem.reference,
        children: scaledChildren,
      },
    }
  },

  isInSyncWithRecipe(item: RecipeItem, recipe: Recipe): boolean {
    const itemChildren = item.reference.children
    const recipeChildren = recipe.items

    const normalizedItemChildren =
      Items.normalizedQuantitiesShallow(itemChildren)
    const normalizedRecipeChildren =
      Items.normalizedQuantitiesShallow(recipeChildren)

    return Items.equals(normalizedItemChildren, normalizedRecipeChildren)
  },

  of(item: RecipeItem) {
    const itemExt = ItemExt.of(item)
    return {
      ...itemExt,
      value: item,
      syncWithOriginal: (originalRecipeItems: readonly Item[]) =>
        RecipeItemExt.syncWithOriginal(item, originalRecipeItems),
      scaleQuantityAndChildren: (newQuantity: number, recipe: Recipe) =>
        RecipeItemExt.scaleQuantityAndChildren(item, recipe, newQuantity),
      isInSyncWithRecipe: (recipe: Recipe) =>
        RecipeItemExt.isInSyncWithRecipe(item, recipe),
    }
  },
}
