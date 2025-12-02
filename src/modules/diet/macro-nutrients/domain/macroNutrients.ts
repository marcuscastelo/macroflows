import { z } from 'zod/v4'

import { createZodEntity } from '~/shared/domain/validation'
import { parseWithStack } from '~/shared/utils/parseWithStack'

const ze = createZodEntity('MacroNutrients')

// TODO: Use macroNutrientsSchema for other schemas that need macro nutrients
const macronutrientsEntity = ze.create(
  {
    carbsInMg: ze
      .number()
      .or(z.nan()) // TODO: Remove NaN once all data is migrated and validated (NaN occurs on CopyLastDayButton on Test user)
      .transform((v) => (isNaN(v) || v < 0 ? 0 : v)),
    proteinInMg: ze
      .number()
      .or(z.nan())
      .transform((v) => (isNaN(v) || v < 0 ? 0 : v)),
    fatInMg: ze
      .number()
      .or(z.nan())
      .transform((v) => (isNaN(v) || v < 0 ? 0 : v)),
  } as const,
  {},
)

const { schema: macroNutrientsSchema_ } = macronutrientsEntity
export const macroNutrientsSchema = macroNutrientsSchema_.transform((val) => ({
  ...val,
  carbsInGrams: () => val.carbsInMg / 1000,
  proteinInGrams: () => val.proteinInMg / 1000,
  fatInGrams: () => val.fatInMg / 1000,
  __type: 'MacroNutrients' as const,
}))

export type MacroNutrients = Readonly<z.infer<typeof macroNutrientsSchema>>
export type MacroNutrientsRecord = Omit<
  MacroNutrients,
  '__type' | 'carbsInGrams' | 'proteinInGrams' | 'fatInGrams'
>

export function createMacroNutrients(
  data:
    | MacroNutrientsRecord
    | {
        carbsInGrams: number
        proteinInGrams: number
        fatInGrams: number
      },
): MacroNutrients {
  if ('carbsInGrams' in data) {
    return parseWithStack(macroNutrientsSchema, {
      carbsInMg: data.carbsInGrams * 1000,
      proteinInMg: data.proteinInGrams * 1000,
      fatInMg: data.fatInGrams * 1000,
    })
  }

  return parseWithStack(macroNutrientsSchema, data)
}
