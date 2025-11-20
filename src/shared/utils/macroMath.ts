import { calcDayMacros } from '~/modules/diet/day-diet/application/usecases/dayMacros'
import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { calcCalories } from '~/modules/diet/macro-nutrients/application/macroMath'
import { type Meal } from '~/modules/diet/meal/domain/meal'
import { type Recipe } from '~/modules/diet/recipe/domain/recipe'
import { ItemExt } from '~/modules/diet/unified-item/application/itemExt'
import { type UnifiedItem } from '~/modules/diet/unified-item/schema/unifiedItemSchema'

export const calcRecipeCalories = (recipe: Recipe) =>
  calcCalories(ItemExt.calcItemContainerMacros(recipe))

export const calcUnifiedItemCalories = (item: UnifiedItem) =>
  calcCalories(ItemExt.calcUnifiedItemMacros(item))

export const calcMealCalories = (meal: Meal) =>
  calcCalories(ItemExt.calcItemContainerMacros(meal))

export const calcDayCalories = (day: DayDiet) =>
  calcCalories(calcDayMacros(day))
