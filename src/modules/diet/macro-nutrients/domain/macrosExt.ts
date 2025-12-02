import { type MacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'

const DEFAULT_TOLERANCE = 0.01

export const Macros = {
  approxEqual(
    a: MacroNutrients,
    b: MacroNutrients,
    tolerance: number = DEFAULT_TOLERANCE,
  ): boolean {
    const carbsDiff = Math.abs(a.carbsInMg - b.carbsInMg)
    const proteinDiff = Math.abs(a.proteinInMg - b.proteinInMg)
    const fatDiff = Math.abs(a.fatInMg - b.fatInMg)

    return (
      carbsDiff <= tolerance && proteinDiff <= tolerance && fatDiff <= tolerance
    )
  },
}
