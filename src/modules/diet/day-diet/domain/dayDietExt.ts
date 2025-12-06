import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { ItemExt } from '~/modules/diet/item/domain/ext/itemExt'
import { MacroNutrientsExt } from '~/modules/diet/macro-nutrients/domain/macroExt'
import {
  createMacroNutrients,
  type MacroNutrients,
  type MacroNutrientsRecord,
} from '~/modules/diet/macro-nutrients/domain/macroNutrients'

export const DayDietExt = {
  calcDayMacros(day: DayDiet): MacroNutrients {
    const result = day.meals.reduce(
      (acc, meal) => {
        const mealMacros = ItemExt.calcItemContainerMacros(meal)
        acc.carbsInMg += mealMacros.carbsInMg
        acc.fatInMg += mealMacros.fatInMg
        acc.proteinInMg += mealMacros.proteinInMg
        return acc
      },
      {
        carbsInMg: 0,
        fatInMg: 0,
        proteinInMg: 0,
      } satisfies MacroNutrientsRecord,
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
