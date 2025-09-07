import {
  type Food,
  foodSchema,
  type NewFood,
} from '~/modules/diet/food/domain/food'
import { type Database } from '~/shared/supabase/database.types'
import { parseWithStack } from '~/shared/utils/parseWithStack'

export type FoodDTO = Database['public']['Tables']['foods']['Row']
export type InsertFoodDTO = Database['public']['Tables']['foods']['Insert']
export type UpdateFoodDTO = Database['public']['Tables']['foods']['Update']

function toDomain(dao: FoodDTO): Food {
  return parseWithStack(foodSchema, {
    ...dao,
    ean: dao.ean ?? null,
    source: dao.source ?? undefined,
  })
}

function toInsertDTO(newFood: NewFood): InsertFoodDTO {
  return {
    name: newFood.name,
    ean: newFood.ean ?? null,
    macros: newFood.macros,
    source: newFood.source ?? null,
  }
}

function toUpdateDTO(food: Food): UpdateFoodDTO {
  return {
    name: food.name,
    ean: food.ean ?? null,
    macros: food.macros,
    source: food.source ?? null,
  }
}

export const supabaseFoodMapper = {
  toDomain,
  toInsertDTO,
  toUpdateDTO,
}
