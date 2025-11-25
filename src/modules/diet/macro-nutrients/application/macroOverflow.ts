import {
  currentDayDiet,
  targetDay,
} from '~/modules/diet/day-diet/application/usecases/dayState'
import { DayDietExt } from '~/modules/diet/day-diet/domain/dayDietExt'
import {
  createMacroNutrients,
  type MacroNutrients,
  type MacroNutrientsRecord,
} from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { macroTargetUseCases } from '~/modules/diet/macro-target/application/macroTargetUseCases'
import { ItemExt } from '~/modules/diet/unified-item/domain/itemExt'
import { type UnifiedItem } from '~/modules/diet/unified-item/schema/unifiedItemSchema'
import { stringToDate } from '~/shared/utils/date/dateUtils'
import { logging } from '~/shared/utils/logging'

function getContext() {
  const currentDayDiet_ = currentDayDiet()
  if (currentDayDiet_ === null) {
    logging.warn('No current day diet available for overflow check')
    return null
  }

  const macroTarget_ = macroTargetUseCases.macroTargetAt(
    stringToDate(targetDay()),
  )
  if (macroTarget_ === null) {
    logging.warn('No macro target set for the day')
    return null
  }

  return {
    currentDayDiet: currentDayDiet_,
    macroTarget: macroTarget_,
  }
}

export function isOverflow(args: {
  item: UnifiedItem
  originalItem?: UnifiedItem
}): Record<keyof MacroNutrientsRecord, () => boolean> {
  const context = getContext()
  if (context === null) {
    return {
      carbs: () => false,
      protein: () => false,
      fat: () => false,
    }
  }

  const { currentDayDiet, macroTarget } = context

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

export const macroOverflowUseCases = {
  isOverflow,
}
