import { calcDayMacros } from '~/modules/diet/day-diet/application/usecases/dayMacros'
import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { MacroNutrientsExt } from '~/modules/diet/macro-nutrients/application/macroExt'
import { ItemExt } from '~/modules/diet/unified-item/application/itemExt'
import { type UnifiedItem } from '~/modules/diet/unified-item/schema/unifiedItemSchema'

export const calcUnifiedItemCalories = (item: UnifiedItem) =>
  MacroNutrientsExt.calories(ItemExt.macros(item))

export const calcDayCalories = (day: DayDiet) =>
  MacroNutrientsExt.calories(calcDayMacros(day))
