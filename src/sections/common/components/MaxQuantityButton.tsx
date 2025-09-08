import type { JSX } from 'solid-js'

import { logging } from '~/shared/utils/logging'
import { latestWeight } from '~/shared/utils/weightUtils'

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
 * @param macroTargets - Daily macro limits
 * @param itemMacros - Macro values per unit for the item
 * @param onMaxSelected - Callback to set the input value
 * @param disabled - Disables the button if true
 * @returns JSX.Element
 */
export function MaxQuantityButton(props: MaxQuantityButtonProps): JSX.Element {
  function calculateMaxQuantity(): number {
    // DEBUG: Start calculation

    logging.debug('calculateMaxQuantity called')
    let max = Infinity

    const userWeightKg = latestWeight()?.weight
    if (typeof userWeightKg !== 'number' || userWeightKg <= 0) {
      logging.debug('Invalid user weight:', { userWeightKg })
      return 0
    }

    logging.debug('User weight (kg):', { userWeightKg })
    const macroKeys: (keyof MacroValues)[] = ['carbs', 'protein', 'fat']
    for (const macro of macroKeys) {
      const per100g = props.itemMacros[macro]
      const macroTargetPerKg = props.macroTargets[macro]
      if (typeof macroTargetPerKg !== 'number' || macroTargetPerKg <= 0) {
        logging.debug(
          `Skipping macro ${macro}: macroTargetPerKg invalid (macroTargetPerKg: ${macroTargetPerKg})`,
        )
        continue
      }
      // macroTarget em g/kg, precisa multiplicar pelo peso do usuário
      const macroTarget = macroTargetPerKg * userWeightKg

      logging.debug(
        `Macro: ${macro}, per100g: ${per100g}, macroTarget (total): ${macroTarget}`,
      )
      if (
        typeof per100g === 'number' &&
        per100g > 0 &&
        typeof macroTarget === 'number'
      ) {
        // Quantidade máxima em porções de 100g
        const allowed = Math.floor(macroTarget / per100g)

        logging.debug(
          `Allowed for macro ${macro}: Math.floor(${macroTarget} / ${per100g}) = ${allowed}`,
        )
        if (allowed < max) {
          logging.debug(
            `New max found: ${allowed} (was ${max}) for macro ${macro}`,
          )
          max = allowed
        }
      } else {
        logging.debug(
          `Skipping macro ${macro}: per100g or macroTarget invalid (per100g: ${per100g}, macroTarget: ${macroTarget})`,
        )
      }
    }

    logging.debug('Final max:', { max })
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
