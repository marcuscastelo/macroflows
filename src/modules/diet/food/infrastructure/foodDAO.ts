import { z } from 'zod/v4'

import {
  type Food,
  foodSchema,
  type NewFood,
} from '~/modules/diet/food/domain/food'
import { macroNutrientsSchema } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { parseWithStack } from '~/shared/utils/parseWithStack'

export const foodDAOSchema = z.object({
  id: z.number(),
  name: z.string(),
  ean: z.string().nullable().optional(),
  macros: macroNutrientsSchema,
  source: z
    .object({
      type: z.literal('api'),
      id: z.string(),
    })
    .nullable()
    .optional(),
})

const createFoodDAOSchema = foodDAOSchema.omit({ id: true })

export type FoodDAO = z.infer<typeof foodDAOSchema>
type CreateFoodDAO = z.infer<typeof createFoodDAOSchema>

export function createFoodFromDAO(dao: FoodDAO): Food {
  return parseWithStack(foodSchema, {
    ...dao,
    ean: dao.ean ?? null,
    source: dao.source ?? undefined,
  })
}

export function createInsertFoodDAOFromNewFood(
  newFood: NewFood,
): CreateFoodDAO {
  return parseWithStack(createFoodDAOSchema, {
    name: newFood.name,
    ean: newFood.ean ?? null,
    macros: newFood.macros,
    source: newFood.source ?? null,
  })
}
