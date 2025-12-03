import {
  type DayDiet,
  dayDietSchema,
  type NewDayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import { supabaseMealMapper } from '~/modules/diet/meal/infrastructure/supabase/supabaseMealMapper'
import { type Database } from '~/shared/supabase/database.types'
import { parseWithStack } from '~/shared/utils/parseWithStack'

export type DayDietDTO = Database['public']['Tables']['days']['Row']
export type InsertDayDietDTO = Database['public']['Tables']['days']['Insert']

function toInsertDTO(newDayDiet: NewDayDiet): InsertDayDietDTO {
  return {
    target_day: newDayDiet.target_day,
    user_id: newDayDiet.user_id,
    meals: newDayDiet.meals.map((meal) => supabaseMealMapper.toInsertDTO(meal)),
  }
}

function toDomain(dto: DayDietDTO): DayDiet {
  if (!Array.isArray(dto.meals)) {
    throw new Error('DayDiet DTO meals field is not an array')
  }

  return parseWithStack(dayDietSchema, {
    id: dto.id,
    target_day: dto.target_day,
    user_id: dto.user_id,
    meals: dto.meals.map((meal) => supabaseMealMapper.toDomain(meal)),
  })
}

export const supabaseDayMapper = {
  toInsertDTO,
  toDomain,
}
