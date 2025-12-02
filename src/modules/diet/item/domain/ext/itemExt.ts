import { FoodItemExt } from '~/modules/diet/item/domain/ext/foodItemExt'
import { GroupItemExt } from '~/modules/diet/item/domain/ext/groupItemExt'
import { RecipeItemExt } from '~/modules/diet/item/domain/ext/recipeItemExt'
import {
  type FoodItem,
  type GroupItem,
  isFoodItem,
  isGroupItem,
  isRecipeItem,
  type Item,
  type RecipeItem,
} from '~/modules/diet/item/schema/itemSchema'
import { MacroNutrientsExt } from '~/modules/diet/macro-nutrients/domain/macroExt'
import {
  createMacroNutrients,
  type MacroNutrients,
} from '~/modules/diet/macro-nutrients/domain/macroNutrients'

function calcFoodItemMacros(item: FoodItem) {
  // For food items, calculate proportionally from stored macros in reference
  return createMacroNutrients({
    carbs: (item.reference.macros.carbs * item.quantity) / 100,
    fat: (item.reference.macros.fat * item.quantity) / 100,
    protein: (item.reference.macros.protein * item.quantity) / 100,
  })
}

/**
 * Calculates macros for a RecipeItem by summing its children's macros directly.
 * The multiplier only affects the displayed mainQuantity, NOT the nutritional values.
 * Nutrient values are determined by the raw ingredients (children).
 */
function calcRecipeItemMacros(item: RecipeItem): MacroNutrients {
  // For recipe items, sum the macros from children directly.
  // The multiplier only affects the displayed quantity (mainQuantity),
  // not the nutritional content which is determined by the raw ingredients.
  return item.reference.children.reduce(
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
}

/**
 * Calculates macros for a GroupItem by summing children's macros and scaling
 * based on the group's quantity relative to children's total quantity.
 * This allows users to scale a group up or down to adjust portion sizes.
 */
function calcGroupItemMacros(item: GroupItem): MacroNutrients {
  // For group items, sum the macros from children and scale by quantity ratio
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
  calcItemContainerMacros<T extends { items: readonly Item[] }>(
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

  macros(item: Item | undefined): MacroNutrients {
    if (item === undefined) {
      return createMacroNutrients({ carbs: 0, fat: 0, protein: 0 })
    }

    if (isFoodItem(item)) {
      return calcFoodItemMacros(item)
    } else if (isRecipeItem(item)) {
      return calcRecipeItemMacros(item)
    } else if (isGroupItem(item)) {
      return calcGroupItemMacros(item)
    }

    // Fallback for unknown types
    item satisfies never
    return createMacroNutrients({ carbs: 0, fat: 0, protein: 0 })
  },

  of(item: Item) {
    return {
      // Self reference
      value: item,
      // Props
      quantity: () => item.quantity,
      reference: () => item.reference,
      // Derived props
      macros: () => MacroNutrientsExt.of(ItemExt.macros(item)),

      // Type guards
      isFoodItem: () => isFoodItem(item),
      isRecipeItem: () => isRecipeItem(item),
      isGroupItem: () => isGroupItem(item),
      asFoodItem: () => (isFoodItem(item) ? FoodItemExt.of(item) : undefined),
      asRecipeItem: () =>
        isRecipeItem(item) ? RecipeItemExt.of(item) : undefined,
      asGroupItem: () =>
        isGroupItem(item) ? GroupItemExt.of(item) : undefined,
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
