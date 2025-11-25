import { type Accessor, createMemo } from 'solid-js'

import { currentDayDiet } from '~/modules/diet/day-diet/application/usecases/dayState'
import { DayDietExt } from '~/modules/diet/day-diet/domain/dayDietExt'
import {
  isOverflow,
  type MacroOverflowContext,
} from '~/modules/diet/macro-nutrients/application/macroOverflow'
import { macroTargetUseCases } from '~/modules/diet/macro-target/application/macroTargetUseCases'
import { ItemExt } from '~/modules/diet/unified-item/domain/itemExt'
import { type UnifiedItem } from '~/modules/diet/unified-item/schema/unifiedItemSchema'
import MacroNutrientsView from '~/sections/macro-nutrients/components/MacroNutrientsView'
import { stringToDate } from '~/shared/utils/date/dateUtils'
import { logging } from '~/shared/utils/logging'

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
  const macros = () => ItemExt.of(props.item()).macros()
  const calories = () => macros().calories()

  // Create macro overflow checker if macroOverflow is enabled
  const isMacroOverflowing = createMemo(() => {
    const fallback = {
      carbs: () => false,
      protein: () => false,
      fat: () => false,
    }

    const overflow = props.macroOverflow?.()
    if (!overflow || !overflow.enable) {
      logging.debug('Macro overflow is not enabled')
      return fallback
    }

    // Convert UnifiedItem to TemplateItem format for overflow check
    const templateItem = props.item()

    const originalTemplateItem = overflow.originalItem

    // Get context for overflow checking
    const currentDayDiet_ = currentDayDiet()
    if (currentDayDiet_ === null) {
      logging.warn('No current day diet available for overflow check')
      return fallback
    }

    const macroTarget = macroTargetUseCases.macroTargetAt(
      stringToDate(currentDayDiet_.target_day),
    )
    if (macroTarget === null) {
      logging.warn('No macro target set for the day')
      return fallback
    }

    const context: MacroOverflowContext = {
      currentDayDiet: currentDayDiet_,
      macroTarget,
    }

    logging.debug('currentDayDiet_=', { currentDayDiet_ })
    logging.debug('macroTarget=', { macroTarget })
    logging.debug('Creating macro overflow checker for item:', templateItem)
    const dayMacros = DayDietExt.calcDayMacros(context.currentDayDiet)

    return isOverflow({
      item: templateItem,
      context,
      originalItem: originalTemplateItem,
      dayMacros,
    })
  })

  return (
    <div class="flex justify-between">
      <div class="flex">
        <MacroNutrientsView
          macros={macros().value}
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
