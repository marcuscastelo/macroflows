import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { calcCalories } from '~/modules/diet/macro-nutrients/application/macroMath'
import { createMacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { type MacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { type Meal } from '~/modules/diet/meal/domain/meal'
import { type Recipe } from '~/modules/diet/recipe/domain/recipe'
import { ItemExt } from '~/modules/diet/unified-item/application/itemExt'
import { type UnifiedItem } from '~/modules/diet/unified-item/schema/unifiedItemSchema'

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

export const calcRecipeCalories = (recipe: Recipe) =>
  calcCalories(ItemExt.calcItemContainerMacros(recipe))

export const calcUnifiedItemCalories = (item: UnifiedItem) =>
  calcCalories(ItemExt.calcUnifiedItemMacros(item))

export const calcMealCalories = (meal: Meal) =>
  calcCalories(ItemExt.calcItemContainerMacros(meal))

export const calcDayCalories = (day: DayDiet) =>
  calcCalories(calcDayMacros(day))
