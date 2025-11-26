import { MacroNutrientsExt } from '~/modules/diet/macro-nutrients/domain/macroExt'
import {
  createMacroNutrients,
  type MacroNutrients,
} from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { Items } from '~/modules/diet/unified-item/domain/itemsExt'
import {
  type FoodItem,
  type GroupItem,
  isFoodItem,
  isGroupItem,
  isRecipeItem,
  type RecipeItem,
  type UnifiedItem,
} from '~/modules/diet/unified-item/schema/unifiedItemSchema'

function calcFoodItemMacros(item: FoodItem) {
  // For food items, calculate proportionally from stored macros in reference
  return createMacroNutrients({
    carbs: (item.reference.macros.carbs * item.quantity) / 100,
    fat: (item.reference.macros.fat * item.quantity) / 100,
    protein: (item.reference.macros.protein * item.quantity) / 100,
  })
}

function calcItemContainerMacros(item: RecipeItem | GroupItem): MacroNutrients {
  // For recipe and group items, sum the macros from children
  // The quantity field represents the total prepared amount, not a scaling factor
  const defaultQuantity = item.reference.children.reduce(
    (acc, child) => acc + child.quantity,
    0,
  )

  if (defaultQuantity === 0) {
    return createMacroNutrients({ carbs: 0, fat: 0, protein: 0 })
  }

  const defaultMacros = item.reference.children.reduce(
    (acc, child) => {
      const childMacros = ItemExt.macros(child)
      return createMacroNutrients({
        carbs: acc.carbs + childMacros.carbs,
        fat: acc.fat + childMacros.fat,
        protein: acc.protein + childMacros.protein,
      })
    },
    createMacroNutrients({ carbs: 0, fat: 0, protein: 0 }),
  )

  return createMacroNutrients({
    carbs: (item.quantity / defaultQuantity) * defaultMacros.carbs,
    fat: (item.quantity / defaultQuantity) * defaultMacros.fat,
    protein: (item.quantity / defaultQuantity) * defaultMacros.protein,
  })
}

export const ItemExt = {
  calcItemContainerMacros<T extends { items: readonly UnifiedItem[] }>(
    container: T,
  ): MacroNutrients {
    const result = container.items.reduce(
      (acc, item) => {
        const itemMacros = ItemExt.macros(item)
        acc.carbs += itemMacros.carbs
        acc.fat += itemMacros.fat
        acc.protein += itemMacros.protein
        return acc
      },
      { carbs: 0, fat: 0, protein: 0 },
    )
    return createMacroNutrients(result)
  },

  macros(item: UnifiedItem | undefined): MacroNutrients {
    if (item === undefined) {
      return createMacroNutrients({ carbs: 0, fat: 0, protein: 0 })
    }

    if (isFoodItem(item)) {
      return calcFoodItemMacros(item)
    } else if (isRecipeItem(item) || isGroupItem(item)) {
      return calcItemContainerMacros(item)
    }

    // Fallback for unknown types
    item satisfies never
    return createMacroNutrients({ carbs: 0, fat: 0, protein: 0 })
  },

  isInSyncWithRecipe(
    item: UnifiedItem,
    recipeItems: readonly UnifiedItem[],
  ): boolean {
    if (!isRecipeItem(item)) {
      throw new Error('isInSyncWithRecipe can only be called on RecipeItem')
    }

    return Items.equals(recipeItems, item.reference.children)
  },

  of(item: UnifiedItem) {
    return {
      // Self reference
      value: item,
      // Props
      quantity: () => item.quantity,
      reference: () => item.reference,
      // Derived props
      macros: () => MacroNutrientsExt.of(ItemExt.macros(item)),
      isInSyncWithRecipe: (recipeItems: readonly UnifiedItem[]) =>
        ItemExt.isInSyncWithRecipe(item, recipeItems),
      // Type guards
      isFoodItem: () => isFoodItem(item),
      isRecipeItem: () => isRecipeItem(item),
      isGroupItem: () => isGroupItem(item),
      asFoodItem: () => (isFoodItem(item) ? item : undefined),
      asRecipeItem: () => (isRecipeItem(item) ? item : undefined),
      asGroupItem: () => (isGroupItem(item) ? item : undefined),
      ifFoodItem: <T>(fn: (foodItem: FoodItem) => T, defaultValue: T): T =>
        isFoodItem(item) ? fn(item) : defaultValue,
      ifRecipeItem: <T>(
        fn: (recipeItem: RecipeItem) => T,
        defaultValue: T,
      ): T => (isRecipeItem(item) ? fn(item) : defaultValue),
      ifGroupItem: <T>(fn: (groupItem: GroupItem) => T, defaultValue: T): T =>
        isGroupItem(item) ? fn(item) : defaultValue,
    } as const
  },
}
