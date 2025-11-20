import { type MacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'

export const MacroNutrientsExt = {
  calories(macroNutrients: MacroNutrients): number {
    return (
      macroNutrients.carbs * 4 +
      macroNutrients.protein * 4 +
      macroNutrients.fat * 9
    )
  },

  of(macroNutrients: MacroNutrients) {
    return {
      // Self reference
      value: macroNutrients,
      // Props
      carbs: () => macroNutrients.carbs,
      protein: () => macroNutrients.protein,
      fat: () => macroNutrients.fat,
      // Derived props
      calories: () => MacroNutrientsExt.calories(macroNutrients),
    } as const
  },
}
