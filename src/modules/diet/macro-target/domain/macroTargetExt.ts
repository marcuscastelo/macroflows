import { MacroNutrientsExt } from '~/modules/diet/macro-nutrients/domain/macroExt'
import {
  createMacroNutrients,
  type MacroNutrients,
} from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { type MacroTarget } from '~/modules/diet/macro-target/domain/macroTarget'

export const MacroTargetExt = {
  forWeight(macroTarget: MacroTarget, weightKg: number): MacroNutrients {
    return createMacroNutrients({
      carbs: weightKg * macroTarget.gramsPerKgCarbs,
      protein: weightKg * macroTarget.gramsPerKgProtein,
      fat: weightKg * macroTarget.gramsPerKgFat,
    })
  },

  of(macroTarget: MacroTarget) {
    return {
      // Self reference
      value: macroTarget,
      // Props
      gramsPerKgCarbs: () => macroTarget.gramsPerKgCarbs,
      gramsPerKgFat: () => macroTarget.gramsPerKgFat,
      gramsPerKgProtein: () => macroTarget.gramsPerKgProtein,
      // Derived props
      forWeight: (weightKg: number) =>
        MacroNutrientsExt.of(MacroTargetExt.forWeight(macroTarget, weightKg)),
    } as const
  },
}
