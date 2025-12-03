import { type MacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'

export const DEFAULT_TOLERANCE_MG = 1

export const Macros = {
  approxEqual(
    a: MacroNutrients,
    b: MacroNutrients,
    tolerance: number = DEFAULT_TOLERANCE_MG,
  ): boolean {
    const carbsDiff = Math.abs(a.carbsInMg - b.carbsInMg)
    const proteinDiff = Math.abs(a.proteinInMg - b.proteinInMg)
    const fatDiff = Math.abs(a.fatInMg - b.fatInMg)

    return (
      carbsDiff <= tolerance && proteinDiff <= tolerance && fatDiff <= tolerance
    )
  },
}
