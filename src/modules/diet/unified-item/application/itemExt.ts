import {
  createMacroNutrients,
  type MacroNutrients,
} from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import {
  isFoodItem,
  isGroupItem,
  isRecipeItem,
  type UnifiedItem,
} from '~/modules/diet/unified-item/schema/unifiedItemSchema'

export const ItemExt = {
  calcItemContainerMacros<T extends { items: readonly UnifiedItem[] }>(
    container: T,
  ): MacroNutrients {
    const result = container.items.reduce(
      (acc, item) => {
        const itemMacros = ItemExt.calcUnifiedItemMacros(item)
        acc.carbs += itemMacros.carbs
        acc.fat += itemMacros.fat
        acc.protein += itemMacros.protein
        return acc
      },
      { carbs: 0, fat: 0, protein: 0 },
    )
    return createMacroNutrients(result)
  },

  /**
   * Calculates macros for a UnifiedItem, handling all reference types
   */
  calcUnifiedItemMacros(item: UnifiedItem | undefined): MacroNutrients {
    if (item === undefined) {
      return createMacroNutrients({ carbs: 0, fat: 0, protein: 0 })
    }

    if (isFoodItem(item)) {
      // For food items, calculate proportionally from stored macros in reference
      return createMacroNutrients({
        carbs: (item.reference.macros.carbs * item.quantity) / 100,
        fat: (item.reference.macros.fat * item.quantity) / 100,
        protein: (item.reference.macros.protein * item.quantity) / 100,
      })
    } else if (isRecipeItem(item) || isGroupItem(item)) {
      // For recipe and group items, sum the macros from children
      // The quantity field represents the total prepared amount, not a scaling factor
      const defaultQuantity = item.reference.children.reduce(
        (acc, child) => acc + child.quantity,
        0,
      )
      const defaultMacros = item.reference.children.reduce(
        (acc, child) => {
          const childMacros = ItemExt.calcUnifiedItemMacros(child)
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

    // Fallback for unknown types
    item satisfies never
    return createMacroNutrients({ carbs: 0, fat: 0, protein: 0 })
  },
}
