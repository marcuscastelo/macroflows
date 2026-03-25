import { type DayUseCases } from '~/modules/diet/day-diet/application/usecases/dayUseCases'
import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { DayDietExt } from '~/modules/diet/day-diet/domain/dayDietExt'
import { ItemExt } from '~/modules/diet/item/domain/ext/itemExt'
import { type Item } from '~/modules/diet/item/schema/itemSchema'
import {
  createMacroNutrients,
  type MacroNutrients,
} from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { type MacroTargetUseCases } from '~/modules/diet/macro-target/application/macroTargetUseCases'
import { stringToDate } from '~/shared/utils/date/dateUtils'
import { logging } from '~/shared/utils/logging'

/**
 * Factory that creates macro-nutrients overflow helpers.
 *
 * Allows injecting dependencies for testing or DI wiring:
 * - `dayUseCases` provides access to current day state
 * - `macroTargetUseCases` provides macro target lookup for a given date
 * - `stringToDate`, `DayDietExt`, `ItemExt`, and `createMacroNutrients` can be injected if needed
 *
 * Returned API:
 * - `isOverflow({ item, originalItem? })` => record of boolean getters for carbs/protein/fat
 * - `getAvailableMacros({ dayDiet, originalItem? })` => MacroNutrients reflecting available macros
 */
export function createMacroOverflow(deps: {
  dayUseCases: DayUseCases
  macroTargetUseCases: MacroTargetUseCases
  stringToDate?: typeof stringToDate
  DayDietExt?: typeof DayDietExt
  ItemExt?: typeof ItemExt
  createMacroNutrients?: typeof createMacroNutrients
}) {
  const localStringToDate = deps.stringToDate ?? stringToDate
  const localDayDietExt = deps.DayDietExt ?? DayDietExt
  const localItemExt = deps.ItemExt ?? ItemExt
  const localCreateMacroNutrients =
    deps.createMacroNutrients ?? createMacroNutrients

  function getContext() {
    const currentDayDiet_ = deps.dayUseCases.currentDayDiet()
    if (currentDayDiet_ === null) {
      logging.warn('No current day diet available for overflow check')
      return null
    }

    const macroTarget_ = deps.macroTargetUseCases.macroTargetAt(
      localStringToDate(deps.dayUseCases.targetDay()),
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

  function isOverflow(args: {
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

    const itemMacros = localItemExt.macros(args.item)
    const originalItemMacros: MacroNutrients =
      args.originalItem !== undefined
        ? localItemExt.macros(args.originalItem)
        : localCreateMacroNutrients({
            carbsInGrams: 0,
            proteinInGrams: 0,
            fatInGrams: 0,
          })

    const dayMacros = localDayDietExt.calcDayMacros(currentDayDiet)

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
    const dayMacros = localDayDietExt.calcDayMacros(dayDiet)

    const macroTarget = deps.macroTargetUseCases.macroTargetAt(
      new Date(dayDiet.target_day),
    )
    if (!macroTarget) {
      return localCreateMacroNutrients({
        carbsInMg: 0,
        proteinInMg: 0,
        fatInMg: 0,
      })
    }

    const originalItem = args.originalItem
    const originalMacros = localItemExt.macros(originalItem)
    return localCreateMacroNutrients({
      carbsInMg:
        macroTarget.carbsInMg - dayMacros.carbsInMg + originalMacros.carbsInMg,
      proteinInMg:
        macroTarget.proteinInMg -
        dayMacros.proteinInMg +
        originalMacros.proteinInMg,
      fatInMg: macroTarget.fatInMg - dayMacros.fatInMg + originalMacros.fatInMg,
    })
  }

  return {
    isOverflow,
    getAvailableMacros,
  }
}

export type MacroOverflowUseCases = ReturnType<typeof createMacroOverflow>
