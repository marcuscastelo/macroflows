import { z } from 'zod/v4'

import { createZodEntity } from '~/shared/domain/validation'
import { parseWithStack } from '~/shared/utils/parseWithStack'

const ze = createZodEntity('MacroNutrients')

// TODO: Use macroNutrientsSchema for other schemas that need macro nutrients
const macronutrientsEntity = ze.create(
  {
    carbs: ze
      .number()
      .or(z.nan()) // TODO: Remove NaN once all data is migrated and validated (NaN occurs on CopyLastDayButton on Test user)
      .transform((v) => (isNaN(v) || v < 0 ? 0 : v)),
    protein: ze
      .number()
      .or(z.nan())
      .transform((v) => (isNaN(v) || v < 0 ? 0 : v)),
    fat: ze
      .number()
      .or(z.nan())
      .transform((v) => (isNaN(v) || v < 0 ? 0 : v)),
  } as const,
  {},
)

export const { schema: macroNutrientsSchema } = macronutrientsEntity
export type MacroNutrients = Readonly<z.infer<typeof macroNutrientsSchema>>
export type MacroNutrientsRecord = Omit<MacroNutrients, '__type'>

export function createMacroNutrients(
  data: Omit<MacroNutrients, '__type'>,
): MacroNutrients {
  return parseWithStack(macroNutrientsSchema, data)
}
