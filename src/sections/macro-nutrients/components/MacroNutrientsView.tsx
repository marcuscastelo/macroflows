import { mergeProps } from 'solid-js'

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

  return (
    <>
      <span
        class={cn('mr-1 text-green-400', {
          'text-rose-600 dark:text-red-500 animate-pulse font-extrabold uppercase':
            isMacroOverflowing().carbs(),
        })}
      >
        {' '}
        C: {Math.round(props.macros.carbsInGrams() * 100) / 100}{' '}
      </span>
      <span
        class={cn('mr-1 text-red-700', {
          'text-rose-600 dark:text-red-500 animate-pulse font-extrabold uppercase':
            isMacroOverflowing().protein(),
        })}
      >
        {' '}
        P: {Math.round(props.macros.proteinInGrams() * 100) / 100}{' '}
      </span>
      <span
        class={cn('text-orange-400', {
          'text-rose-600 dark:text-red-500 animate-pulse font-extrabold uppercase':
            isMacroOverflowing().fat(),
        })}
      >
        {' '}
        G: {Math.round(props.macros.fatInGrams() * 100) / 100}{' '}
      </span>
    </>
  )
}
