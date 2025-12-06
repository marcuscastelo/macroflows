import { type Accessor, createMemo } from 'solid-js'

import { dayUseCases } from '~/modules/diet/day-diet/application/usecases/dayUseCases'
import { ItemExt } from '~/modules/diet/item/domain/ext/itemExt'
import { type Item } from '~/modules/diet/item/schema/itemSchema'
import { createMacroOverflow } from '~/modules/diet/macro-nutrients/application/macroOverflow'
import { macroTargetUseCases } from '~/modules/diet/macro-target/application/macroTargetUseCases'
import MacroNutrientsView from '~/sections/macro-nutrients/components/MacroNutrientsView'
import { logging } from '~/shared/utils/logging'

// Create macro overflow instance for this module
const macroOverflow = createMacroOverflow({
  dayUseCases,
  macroTargetUseCases,
})

export type ItemViewMacrosProps = {
  item: Accessor<Item>
  macroOverflow?: () => {
    enable: boolean
    originalItem?: Item | undefined
  }
}

export function ItemViewMacros(props: ItemViewMacrosProps) {
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

    // Convert Item to TemplateItem format for overflow check
    const item = props.item()
    const originalItem = overflow.originalItem

    logging.debug('Creating macro overflow checker for item:', item)

    return macroOverflow.isOverflow({ item, originalItem })
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
