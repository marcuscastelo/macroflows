import { z } from 'zod/v4'

import { createZodEntity } from '~/shared/domain/validation'
import { parseWithStack } from '~/shared/utils/parseWithStack'

const ze = createZodEntity('MacroNutrients')

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

export const { schema: macroNutrientsSchema } = macronutrientsEntity

/**
 * Strongly-typed representation of macro nutrients stored in milligrams.
 * All fields are normalized to milligrams and are read-only to preserve
 * domain immutability.
 */
export type MacroNutrients = Readonly<z.infer<typeof macroNutrientsSchema>>

/**
 * Partial input shape accepted by the macro nutrients factory. This omits
 * computed convenience gram fields so callers can provide mg-based values
 * directly or use the grams-variant overload of {@link createMacroNutrients}.
 */
export type MacroNutrientsRecord = Omit<
  MacroNutrients,
  '__type' | 'carbsInGrams' | 'proteinInGrams' | 'fatInGrams'
>

/**
 * Create a validated MacroNutrients object.
 *
 * Overloads:
 * - When passed an object with `carbsInGrams`, `proteinInGrams`, `fatInGrams`
 *   the values are converted to milligrams.
 * - Otherwise, pass values in milligrams matching the MacroNutrientsRecord shape.
 *
 * The returned value is validated against the internal schema and will
 * normalize negative or NaN inputs to zero.
 */
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
