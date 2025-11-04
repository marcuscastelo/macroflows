/**
 * Shared validation message utilities for Portuguese error messages.
 * Centralizes common validation patterns to reduce duplication across domain schemas.
 */

import { z } from 'zod/v4'
import { type util } from 'zod/v4/core'

import { parseWithStack } from '~/shared/utils/parseWithStack'

/**
 * Generates invalid type error message in Portuguese.
 */
export function createInvalidTypeMessage(
  fieldName: string,
  entityName: string,
  expectedType: string,
): string {
  return `O campo '${fieldName}' ${entityName} deve ser ${expectedType}.`
}

/**
 * Common entity name mappings for consistent Portuguese messages.
 */
export const ENTITY_NAMES = {
  Food: 'do alimento',
  RecentFood: 'do alimento recente',
  Recipe: 'da receita',
  User: 'do usuário',
  Weight: 'do peso',
  Measure: 'da medida corporal',
  DayDiet: 'da dieta do dia',
  MacroProfile: 'do perfil de macros',
  ItemGroup: 'do grupo de itens',
  Item: 'do item',
  RecipeItem: 'do item de receita',
  Meal: 'da refeição',
  MacroNutrients: 'dos macronutrientes',
  CachedSearch: 'da busca',
} as const

/**
 * Common type descriptions for validation messages.
 */
export const TYPE_DESCRIPTIONS = {
  number: 'um número',
  string: 'uma string',
  date: 'uma data ou string',
  boolean: 'um booleano',
  array: 'uma lista',
  arrayOfNumbers: 'uma lista de números',
  enum: 'enum',
} as const

/**
 * Generic functions to create field validation message handlers.
 * Generates consistent Portuguese error messages for all field types.
 */

/**
 * Generic function to create field validation messages with error handling.
 * This function provides consistent error handling patterns for all field types.
 * Uses iss.path to automatically detect the field name from Zod's validation context.
 */
function createFieldValidationMessages(
  typeDescription: string,
  entityName: string,
  validErrorCode: 'invalid_type' | 'invalid_value' = 'invalid_type',
): z.core.TypeParams<z.ZodType> {
  return {
    error: (iss) => {
      switch (iss.code) {
        case validErrorCode: {
          // Use iss.path to get the field name automatically
          const fieldName =
            iss.path && iss.path.length > 0 ? iss.path.join('.') : 'campo'
          return createInvalidTypeMessage(
            fieldName,
            entityName,
            typeDescription,
          )
        }
        default:
          break
      }
    },
  }
}

/**
 * Zod entity factory that creates field validators for a specific entity.
 * Returns an object with methods for each field type (number, string, date, etc.).
 */
export function createZodEntity<TEntity extends keyof typeof ENTITY_NAMES>(
  entityKey: TEntity,
) {
  const entityName = ENTITY_NAMES[entityKey]

  return {
    /**
     * Creates a Zod number field with Portuguese validation messages.
     */
    number: (): z.ZodNumber =>
      z.number(
        createFieldValidationMessages(TYPE_DESCRIPTIONS.number, entityName),
      ),

    /**
     * Creates a Zod string field with Portuguese validation messages.
     */
    string: (): z.ZodString =>
      z.string(
        createFieldValidationMessages(TYPE_DESCRIPTIONS.string, entityName),
      ),

    /**
     * Creates a Zod date field with Portuguese validation messages.
     */
    date: (): z.ZodDate =>
      z.date(createFieldValidationMessages(TYPE_DESCRIPTIONS.date, entityName)),

    /**
     * Creates a Zod enum field with Portuguese validation messages.
     */
    enum: <T extends util.EnumLike = util.EnumLike>(values: T): z.ZodEnum<T> =>
      z.enum(
        values,
        createFieldValidationMessages(
          TYPE_DESCRIPTIONS.enum,
          entityName,
          'invalid_value',
        ),
      ),

    /**
     * Creates a Zod array field with Portuguese validation messages.
     */
    array: <T extends z.ZodTypeAny>(elementType: T): z.ZodArray<T> =>
      z.array(
        elementType,
        createFieldValidationMessages(TYPE_DESCRIPTIONS.array, entityName),
      ),

    /**
     * Creates a generic Zod object schema using the current entity context.
     */
    create: <
      TShape extends z.ZodRawShape,
      TExtras extends z.ZodRawShape = {
        id: z.ZodNumber
      },
    >(
      shape: TShape,
      entityExtras?: TExtras,
    ) => {
      const extras =
        entityExtras ??
        ({
          id: z.number(
            createFieldValidationMessages(TYPE_DESCRIPTIONS.number, entityName),
          ),
        } as const satisfies z.ZodRawShape)

      const schema = z.object({
        ...shape,
        ...extras,
        __type: z
          .string()
          .nullish()
          .transform(() => entityKey),
      } as const)
      type Schema = z.infer<typeof schema>

      const newSchema = z.object({
        ...shape,
        __type: z
          .string()
          .nullish()
          .transform(() => `New${entityKey}` as const),
      })

      type NewSchema = z.infer<typeof newSchema>

      const createNew = (
        data: Omit<z.input<typeof newSchema>, '__type'>,
      ): NewSchema => parseWithStack(newSchema, data)

      const promote = (data: NewSchema, extra: { id: number }): Schema =>
        parseWithStack(schema, {
          ...data,
          ...extra,
        })

      const demote = (data: Schema): NewSchema =>
        parseWithStack(newSchema, data)

      return {
        schema,
        newSchema,
        createNew,
        promote,
        demote,
      }
    },
  }
}
