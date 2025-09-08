import { type Accessor, createMemo } from 'solid-js'

import { currentDayDiet } from '~/modules/diet/day-diet/application/usecases/dayState'
import { getMacroTargetForDay } from '~/modules/diet/macro-target/application/macroTarget'
import { type UnifiedItem } from '~/modules/diet/unified-item/schema/unifiedItemSchema'
import MacroNutrientsView from '~/sections/macro-nutrients/components/MacroNutrientsView'
import { stringToDate } from '~/shared/utils/date/dateUtils'
import { logging } from '~/shared/utils/logging'
import {
  calcUnifiedItemCalories,
  calcUnifiedItemMacros,
} from '~/shared/utils/macroMath'
import {
  createMacroOverflowChecker,
  type MacroOverflowContext,
} from '~/shared/utils/macroOverflow'

export type UnifiedItemNutritionalInfoProps = {
  item: Accessor<UnifiedItem>
  macroOverflow?: () => {
    enable: boolean
    originalItem?: UnifiedItem | undefined
  }
}

export function UnifiedItemNutritionalInfo(
  props: UnifiedItemNutritionalInfoProps,
) {
  const calories = createMemo(() => {
    // Force memo to update by depending on the full item structure
    const item = props.item()
    JSON.stringify(item) // Touch the full object to trigger on deep changes
    return calcUnifiedItemCalories(item)
  })

  const macros = createMemo(() => {
    // Force memo to update by depending on the full item structure
    const item = props.item()
    JSON.stringify(item) // Touch the full object to trigger on deep changes
    return calcUnifiedItemMacros(item)
  })

  // Create macro overflow checker if macroOverflow is enabled
  const isMacroOverflowing = createMemo(() => {
    const overflow = props.macroOverflow?.()
    if (!overflow || !overflow.enable) {
      logging.debug('Macro overflow is not enabled')
      return {
        carbs: () => false,
        protein: () => false,
        fat: () => false,
      }
    }

    // Convert UnifiedItem to TemplateItem format for overflow check
    const templateItem = props.item()

    const originalTemplateItem = overflow.originalItem

    // Get context for overflow checking
    const currentDayDiet_ = currentDayDiet()
    const macroTarget = currentDayDiet_
      ? getMacroTargetForDay(stringToDate(currentDayDiet_.target_day))
      : null

    const context: MacroOverflowContext = {
      currentDayDiet: currentDayDiet_,
      macroTarget,
      macroOverflowOptions: {
        enable: true,
        originalItem: originalTemplateItem,
      },
    }

    logging.debug('currentDayDiet_=', { currentDayDiet_ })
    logging.debug('macroTarget=', { macroTarget })

    // If we don't have the context, return false for all
    if (currentDayDiet_ === null || macroTarget === null) {
      return {
        carbs: () => false,
        protein: () => false,
        fat: () => false,
      }
    }

    logging.debug('Creating macro overflow checker for item:', templateItem)
    return createMacroOverflowChecker(templateItem, context)
  })

  return (
    <div class="flex justify-between">
      <div class="flex">
        <MacroNutrientsView
          macros={macros()}
          isMacroOverflowing={isMacroOverflowing()}
        />
      </div>
      <div class="flex items-baseline gap-1">
        <span class="text-white"> {props.item().quantity}g </span>
        <span class="text-gray-400 text-xs">
          ({calories().toFixed(0)} kcal)
        </span>
      </div>
    </div>
  )
}
