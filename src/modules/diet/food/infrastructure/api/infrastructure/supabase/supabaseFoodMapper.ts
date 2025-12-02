import {
  type Food,
  foodSchema,
  type NewFood,
} from '~/modules/diet/food/domain/food'
import { createMacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { type Database } from '~/shared/supabase/database.types'
import { parseWithStack } from '~/shared/utils/parseWithStack'

export type FoodDTO = Database['public']['Tables']['foods']['Row']
export type InsertFoodDTO = Database['public']['Tables']['foods']['Insert']
export type UpdateFoodDTO = Database['public']['Tables']['foods']['Update']

function toDomain(dto: FoodDTO): Food {
  if (
    dto.macros === null ||
    !(typeof dto.macros === 'object') ||
    !('carbs' in dto.macros) ||
    !('protein' in dto.macros) ||
    !('fat' in dto.macros) ||
    typeof dto.macros.carbs !== 'number' ||
    typeof dto.macros.protein !== 'number' ||
    typeof dto.macros.fat !== 'number'
  ) {
    throw new Error('Food DTO is missing macros field')
  }
  return parseWithStack(foodSchema, {
    ...dto,
    ean: dto.ean ?? null,
    source: dto.source ?? undefined,
    macros: createMacroNutrients({
      carbsInMg: dto.macros.carbs * 1000,
      proteinInMg: dto.macros.protein * 1000,
      fatInMg: dto.macros.fat * 1000,
    }),
  })
}

function toInsertDTO(newFood: NewFood): InsertFoodDTO {
  return {
    name: newFood.name,
    ean: newFood.ean ?? null,
    macros: {
      carbs: newFood.macros.carbsInGrams(),
      protein: newFood.macros.proteinInGrams(),
      fat: newFood.macros.fatInGrams(),
    },
    source: newFood.source ?? null,
  }
}

function toUpdateDTO(food: Food): UpdateFoodDTO {
  return {
    name: food.name,
    ean: food.ean ?? null,
    macros: {
      carbs: food.macros.carbsInGrams(),
      protein: food.macros.proteinInGrams(),
      fat: food.macros.fatInGrams(),
    },
    source: food.source ?? null,
  }
}

export const supabaseFoodMapper = {
  toDomain,
  toInsertDTO,
  toUpdateDTO,
}
