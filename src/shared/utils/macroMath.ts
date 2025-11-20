import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { calcCalories } from '~/modules/diet/macro-nutrients/application/macroMath'
import { createMacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { type MacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { type Meal } from '~/modules/diet/meal/domain/meal'
import { type Recipe } from '~/modules/diet/recipe/domain/recipe'
import {
  calcItemContainerMacros,
  calcUnifiedItemMacros,
} from '~/modules/diet/unified-item/application/itemMacros'
import { type UnifiedItem } from '~/modules/diet/unified-item/schema/unifiedItemSchema'

export function calcRecipeMacros(recipe: Recipe): MacroNutrients {
  return calcItemContainerMacros({
    items: recipe.items,
  })
}

export function calcUnifiedRecipeMacros(recipe: Recipe): MacroNutrients {
  return calcItemContainerMacros(recipe)
}

export function calcMealMacros(meal: Meal): MacroNutrients {
  const result = meal.items.reduce(
    (acc, item) => {
      const itemMacros = calcUnifiedItemMacros(item)
      acc.carbs += itemMacros.carbs
      acc.fat += itemMacros.fat
      acc.protein += itemMacros.protein
      return acc
    },
    { carbs: 0, fat: 0, protein: 0 },
  )
  return createMacroNutrients(result)
}

export function calcDayMacros(day: DayDiet): MacroNutrients {
  const result = day.meals.reduce(
    (acc, meal) => {
      const mealMacros = calcMealMacros(meal)
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
  calcCalories(calcRecipeMacros(recipe))

export const calcUnifiedRecipeCalories = (recipe: Recipe) =>
  calcCalories(calcUnifiedRecipeMacros(recipe))

export const calcUnifiedItemCalories = (item: UnifiedItem) =>
  calcCalories(calcUnifiedItemMacros(item))

export const calcMealCalories = (meal: Meal) =>
  calcCalories(calcMealMacros(meal))

export const calcDayCalories = (day: DayDiet) =>
  calcCalories(calcDayMacros(day))
