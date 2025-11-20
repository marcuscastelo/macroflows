import { type MacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'

export const CARBO_CALORIES = 4 as const
export const PROTEIN_CALORIES = 4 as const
export const FAT_CALORIES = 9 as const

export const MacroNutrientsExt = {
  totalCalories(macroNutrients: MacroNutrients): number {
    const caloriesObj = MacroNutrientsExt.caloriesObj(macroNutrients)
    return caloriesObj.carbs + caloriesObj.protein + caloriesObj.fat
  },

  caloriesObj(macroNutrients: MacroNutrients): {
    carbs: number
    protein: number
    fat: number
  } {
    return {
      carbs: macroNutrients.carbs * 4,
      protein: macroNutrients.protein * 4,
      fat: macroNutrients.fat * 9,
    }
  },

  caloriesPercentages(macroNutrients: MacroNutrients): {
    carbs: number
    protein: number
    fat: number
  } {
    const caloriesObj = MacroNutrientsExt.caloriesObj(macroNutrients)
    const totalCalories =
      caloriesObj.carbs + caloriesObj.protein + caloriesObj.fat

    if (totalCalories === 0) {
      return { carbs: 0, protein: 0, fat: 0 }
    }

    return {
      carbs: (caloriesObj.carbs / totalCalories) * 100,
      protein: (caloriesObj.protein / totalCalories) * 100,
      fat: (caloriesObj.fat / totalCalories) * 100,
    }
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
      calories: () => MacroNutrientsExt.totalCalories(macroNutrients),
      caloriesObj: () => MacroNutrientsExt.caloriesObj(macroNutrients),
      caloriesPercentages: () =>
        MacroNutrientsExt.caloriesPercentages(macroNutrients),
    } as const
  },
}
