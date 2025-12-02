import { mergeProps } from 'solid-js'

import { MacroNutrientsExt } from '~/modules/diet/macro-nutrients/domain/macroExt'
import { type MacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { cn } from '~/shared/cn'

export default function MacroNutrientsView(props_: {
  macros: MacroNutrients
  isMacroOverflowing?: {
    carbs: () => boolean
    protein: () => boolean
    fat: () => boolean
  }
}) {
  const props = mergeProps(
    {
      macros: { carbs: 0, protein: 0, fat: 0 },
      isMacroOverflowing: {
        carbs: () => false,
        protein: () => false,
        fat: () => false,
      },
    },
    props_,
  )

  const isMacroOverflowing = () => props.isMacroOverflowing
  const macroExt = () => MacroNutrientsExt.of(props.macros)

  return (
    <>
      <span
        class={cn('mr-1 text-green-400', {
          'text-rose-600 dark:text-red-500 animate-pulse font-extrabold uppercase':
            isMacroOverflowing().carbs(),
        })}
      >
        {' '}
        C: {Math.round(macroExt().carbsInGrams() * 100) / 100}{' '}
      </span>
      <span
        class={cn('mr-1 text-red-700', {
          'text-rose-600 dark:text-red-500 animate-pulse font-extrabold uppercase':
            isMacroOverflowing().protein(),
        })}
      >
        {' '}
        P: {Math.round(macroExt().proteinInGrams() * 100) / 100}{' '}
      </span>
      <span
        class={cn('text-orange-400', {
          'text-rose-600 dark:text-red-500 animate-pulse font-extrabold uppercase':
            isMacroOverflowing().fat(),
        })}
      >
        {' '}
        G: {Math.round(macroExt().fatInGrams() * 100) / 100}{' '}
      </span>
    </>
  )
}
