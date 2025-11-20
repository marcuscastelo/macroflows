import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { MacroNutrientsExt } from '~/modules/diet/macro-nutrients/application/macroExt'
import {
  createMacroNutrients,
  type MacroNutrients,
} from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { ItemExt } from '~/modules/diet/unified-item/application/itemExt'

export const DayDietExt = {
  calcDayMacros(day: DayDiet): MacroNutrients {
    const result = day.meals.reduce(
      (acc, meal) => {
        const mealMacros = ItemExt.calcItemContainerMacros(meal)
        acc.carbs += mealMacros.carbs
        acc.fat += mealMacros.fat
        acc.protein += mealMacros.protein
        return acc
      },
      { carbs: 0, fat: 0, protein: 0 },
    )
    return createMacroNutrients(result)
  },

  of(dayDiet: DayDiet) {
    return {
      // Self reference
      value: dayDiet,
      // Props
      targetDay: () => dayDiet.target_day,
      userId: () => dayDiet.user_id,
      meals: () => dayDiet.meals,
      // Derived props
      macros: () => MacroNutrientsExt.of(DayDietExt.calcDayMacros(dayDiet)),
    } as const
  },
}
