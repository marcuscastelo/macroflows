import { type MacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'

export const MacroNutrientsExt = {
  calcCalories(macroNutrients: MacroNutrients): number {
    return (
      macroNutrients.carbs * 4 +
      macroNutrients.protein * 4 +
      macroNutrients.fat * 9
    )
  },
}
