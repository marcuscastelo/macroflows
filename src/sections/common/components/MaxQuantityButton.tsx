import type { JSX } from 'solid-js'

import { logging } from '~/shared/utils/logging'

export type MacroValues = {
  carbs: number
  protein: number
  fat: number
}

export type MaxQuantityButtonProps = {
  currentValue: number
  macroTargets: MacroValues
  itemMacros: MacroValues
  onMaxSelected: (maxValue: number) => void
  disabled?: boolean
}

/**
 * Button to set the input to the maximum allowed quantity based on macro constraints.
 * @param currentValue - Current value in the input
 * @param macroTargets - Available macro amounts in grams (absolute values, not per-kg)
 * @param itemMacros - Macro values per 100g for the item
 * @param onMaxSelected - Callback to set the input value
 * @param disabled - Disables the button if true
 * @returns JSX.Element
 */
export function MaxQuantityButton(props: MaxQuantityButtonProps): JSX.Element {
  function calculateMaxQuantity(): number {
    logging.debug('calculateMaxQuantity called')
    let max = Infinity

    const macroKeys: (keyof MacroValues)[] = ['carbs', 'protein', 'fat']
    for (const macro of macroKeys) {
      const per100g = props.itemMacros[macro]
      const availableMacro = props.macroTargets[macro]

      if (typeof availableMacro !== 'number' || availableMacro <= 0) {
        logging.debug(
          `Skipping macro ${macro}: availableMacro invalid (availableMacro: ${availableMacro})`,
        )
        continue
      }

      logging.debug(
        `Macro: ${macro}, per100g: ${per100g}, availableMacro: ${availableMacro}`,
      )

      if (
        typeof per100g === 'number' &&
        per100g > 0 &&
        typeof availableMacro === 'number'
      ) {
        // Calculate how many 100g portions fit in available macro,
        // then convert back to grams (multiply by 100)
        const allowed = Math.floor(availableMacro / per100g) * 100

        logging.debug(
          `Allowed for macro ${macro}: Math.floor(${availableMacro} / ${per100g}) * 100 = ${allowed}`,
        )
        if (allowed < max) {
          logging.debug(
            `New max found: ${allowed} (was ${max}) for macro ${macro}`,
          )
          max = allowed
        }
      } else {
        logging.debug(
          `Skipping macro ${macro}: per100g or availableMacro invalid (per100g: ${per100g}, availableMacro: ${availableMacro})`,
        )
      }
    }

    logging.debug('Final max:', { max })
    // Apply 4% safety margin to prevent accidentally exceeding macro limits
    // due to rounding or measurement errors
    const result = max === Infinity ? 0 : max * 0.96

    logging.debug('Returning:', { result })
    return result
  }

  function handleClick() {
    if (props.disabled === true) return
    props.onMaxSelected(calculateMaxQuantity())
  }

  return (
    <button
      type="button"
      aria-label="Set maximum quantity"
      class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold text-blue-500 bg-transparent hover:bg-blue-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 opacity-70 hover:opacity-100 transition-opacity border-none cursor-pointer"
      style={{
        'pointer-events': props.disabled === true ? 'none' : 'auto',
        background: 'transparent',
      }}
      onClick={handleClick}
      disabled={props.disabled === true}
      tabIndex={0}
    >
      Max.
    </button>
  )
}
