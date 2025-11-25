import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { DayDietExt } from '~/modules/diet/day-diet/domain/dayDietExt'
import {
  createMacroNutrients,
  type MacroNutrients,
  type MacroNutrientsRecord,
} from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { ItemExt } from '~/modules/diet/unified-item/domain/itemExt'
import { type UnifiedItem } from '~/modules/diet/unified-item/schema/unifiedItemSchema'

/**
 * MacroOverflowContext provides context for macro overflow checks.
 * @property currentDayDiet - The current day diet or null
 * @property macroTarget - The macro nutrient targets or null
 * @property macroOverflowOptions - Overflow options
 */
export type MacroOverflowContext = {
  currentDayDiet: DayDiet
  macroTarget: MacroNutrients
}

/**
 * Checks if adding/editing an item would cause a macro nutrient to exceed the target.
 * @param item - The item being added or edited
 * @param property - The macro nutrient property to check ('carbs', 'protein', 'fat')
 * @param context - Context containing current day diet, macro target, and overflow options
 * @returns true if the macro would exceed the target, false otherwise
 */

export function isOverflow(args: {
  item: UnifiedItem
  originalItem?: UnifiedItem
  context: MacroOverflowContext
}): Record<keyof MacroNutrientsRecord, () => boolean> {
  const { currentDayDiet, macroTarget } = args.context

  const itemMacros = ItemExt.macros(args.item)
  const originalItemMacros: MacroNutrients =
    args.originalItem !== undefined
      ? ItemExt.macros(args.originalItem)
      : createMacroNutrients({ carbs: 0, protein: 0, fat: 0 })

  const checkOverflowOf = (property: keyof MacroNutrientsRecord) => {
    const current = DayDietExt.calcDayMacros(currentDayDiet)[property]
    const target = macroTarget[property]

    const delta = itemMacros[property] - originalItemMacros[property]
    const newTotal = current + delta

    const doesOverflow = newTotal > target
    return doesOverflow
  }

  return {
    carbs: () => checkOverflowOf('carbs'),
    protein: () => checkOverflowOf('protein'),
    fat: () => checkOverflowOf('fat'),
  }
}
