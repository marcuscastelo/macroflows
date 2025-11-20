import { calcDayMacros } from '~/modules/diet/day-diet/application/usecases/dayMacros'
import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { MacroNutrientsExt } from '~/modules/diet/macro-nutrients/application/macroExt'

export const calcDayCalories = (day: DayDiet) =>
  MacroNutrientsExt.calories(calcDayMacros(day))
