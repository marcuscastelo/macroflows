import { type MacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'

const DEFAULT_TOLERANCE = 0.01

export const Macros = {
  approxEqual(
    a: MacroNutrients,
    b: MacroNutrients,
    tolerance: number = DEFAULT_TOLERANCE,
  ): boolean {
    const carbsDiff = Math.abs(a.carbs - b.carbs)
    const proteinDiff = Math.abs(a.protein - b.protein)
    const fatDiff = Math.abs(a.fat - b.fat)

    return (
      carbsDiff <= tolerance && proteinDiff <= tolerance && fatDiff <= tolerance
    )
  },
}
