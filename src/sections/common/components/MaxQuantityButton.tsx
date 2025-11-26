import type { JSX } from 'solid-js'

import { type MacroNutrientsRecord } from '~/modules/diet/macro-nutrients/domain/macroNutrients'

export type MaxQuantityButtonProps = {
  currentValue: number
  macroTargets: MacroNutrientsRecord
  itemMacros: MacroNutrientsRecord
  onMaxSelected: (maxValue: number) => void
}

export function MaxQuantityButton(_: MaxQuantityButtonProps): JSX.Element {
  function handleClick() {}

  return (
    <button
      type="button"
      aria-label="Set maximum quantity"
      class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold text-blue-500 bg-transparent hover:bg-blue-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 opacity-70 hover:opacity-100 transition-opacity border-none cursor-pointer"
      style={{
        'pointer-events': 'auto',
        background: 'transparent',
      }}
      onClick={handleClick}
      tabIndex={0}
    >
      Max.
    </button>
  )
}
