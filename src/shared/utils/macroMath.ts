import { calcDayMacros } from '~/modules/diet/day-diet/application/usecases/dayMacros'
import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { MacroNutrientsExt } from '~/modules/diet/macro-nutrients/application/macroExt'
import { type Meal } from '~/modules/diet/meal/domain/meal'
import { type Recipe } from '~/modules/diet/recipe/domain/recipe'
import { ItemExt } from '~/modules/diet/unified-item/application/itemExt'
import { type UnifiedItem } from '~/modules/diet/unified-item/schema/unifiedItemSchema'

export const calcRecipeCalories = (recipe: Recipe) =>
  MacroNutrientsExt.calcCalories(ItemExt.calcItemContainerMacros(recipe))

export const calcUnifiedItemCalories = (item: UnifiedItem) =>
  MacroNutrientsExt.calcCalories(ItemExt.calcUnifiedItemMacros(item))

export const calcMealCalories = (meal: Meal) =>
  MacroNutrientsExt.calcCalories(ItemExt.calcItemContainerMacros(meal))

export const calcDayCalories = (day: DayDiet) =>
  MacroNutrientsExt.calcCalories(calcDayMacros(day))
