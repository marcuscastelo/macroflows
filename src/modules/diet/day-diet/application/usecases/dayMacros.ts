import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import {
  createMacroNutrients,
  type MacroNutrients,
} from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { ItemExt } from '~/modules/diet/unified-item/application/itemExt'

export function calcDayMacros(day: DayDiet): MacroNutrients {
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
}
