import { dayUseCases } from '~/modules/diet/day-diet/application/usecases/dayUseCases'
import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { DayDietExt } from '~/modules/diet/day-diet/domain/dayDietExt'
import { ItemExt } from '~/modules/diet/item/domain/ext/itemExt'
import { type Item } from '~/modules/diet/item/schema/itemSchema'
import {
  createMacroNutrients,
  type MacroNutrients,
} from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { macroTargetUseCases } from '~/modules/diet/macro-target/application/macroTargetUseCases'
import { stringToDate } from '~/shared/utils/date/dateUtils'
import { logging } from '~/shared/utils/logging'

function getContext() {
  const currentDayDiet_ = dayUseCases.currentDayDiet()
  if (currentDayDiet_ === null) {
    logging.warn('No current day diet available for overflow check')
    return null
  }

  const macroTarget_ = macroTargetUseCases.macroTargetAt(
    stringToDate(dayUseCases.targetDay()),
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
  item: Item
  originalItem?: Item
}): Record<'carbs' | 'protein' | 'fat', () => boolean> {
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
      : createMacroNutrients({
          carbsInGrams: 0,
          proteinInGrams: 0,
          fatInGrams: 0,
        })

  const dayMacros = DayDietExt.calcDayMacros(currentDayDiet)

  const checkOverflowOf = (property: 'carbs' | 'protein' | 'fat') => {
    const current = dayMacros[`${property}InMg`]
    const target = macroTarget[`${property}InMg`]

    const delta =
      itemMacros[`${property}InMg`] - originalItemMacros[`${property}InMg`]
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

function getAvailableMacros(args: {
  dayDiet: DayDiet
  originalItem?: Item | undefined
}): MacroNutrients {
  logging.debug('getAvailableMacros')
  const dayDiet = args.dayDiet
  const dayMacros = DayDietExt.calcDayMacros(dayDiet)

  const macroTarget = macroTargetUseCases.macroTargetAt(
    new Date(dayDiet.target_day),
  )
  if (!macroTarget) {
    return createMacroNutrients({ carbsInMg: 0, proteinInMg: 0, fatInMg: 0 })
  }

  const originalItem = args.originalItem
  const originalMacros = ItemExt.macros(originalItem)
  return createMacroNutrients({
    carbsInMg:
      macroTarget.carbsInMg - dayMacros.carbsInMg + originalMacros.carbsInMg,
    proteinInMg:
      macroTarget.proteinInMg -
      dayMacros.proteinInMg +
      originalMacros.proteinInMg,
    fatInMg: macroTarget.fatInMg - dayMacros.fatInMg + originalMacros.fatInMg,
  })
}

export const macroOverflowUseCases = {
  isOverflow,
  getAvailableMacros,
}
