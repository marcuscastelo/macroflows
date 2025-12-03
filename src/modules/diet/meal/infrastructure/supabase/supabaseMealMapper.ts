import { supabaseItemMapper } from '~/modules/diet/item/infrastructure/supabase/supabaseItemMapper'
import {
  createNewMeal,
  type Meal,
  promoteMeal,
} from '~/modules/diet/meal/domain/meal'
import { type Json } from '~/shared/supabase/database.types'

function toDomain(mealDTO: Json): Meal {
  if (
    mealDTO === null ||
    !(typeof mealDTO === 'object') ||
    !('id' in mealDTO) ||
    !('name' in mealDTO) ||
    !('items' in mealDTO) ||
    typeof mealDTO.id !== 'number' ||
    typeof mealDTO.name !== 'string' ||
    !Array.isArray(mealDTO.items)
  ) {
    throw new Error(
      'Food DTO is missing meal field: ' + JSON.stringify(mealDTO),
    )
  }

  return promoteMeal(
    createNewMeal({
      name: mealDTO.name,
      items: mealDTO.items.map((item: Json) =>
        supabaseItemMapper.toDomain(item),
      ),
    }),
    { id: mealDTO.id },
  )
}

function toSupabaseDTO(meal: Meal): Json {
  return {
    ...meal,
    items: meal.items.map((item) => supabaseItemMapper.toInsertDTO(item)),
  }
}

export const supabaseMealMapper = {
  toDomain,
  toInsertDTO: (meal: Meal): Json => toSupabaseDTO(meal),
  toUpdateDTO: (meal: Meal): Json => toSupabaseDTO(meal),
}
