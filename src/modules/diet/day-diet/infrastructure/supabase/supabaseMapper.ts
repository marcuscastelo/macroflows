import {
  type DayDiet,
  dayDietSchema,
  type NewDayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import { type Database } from '~/shared/supabase/database.types'
import { parseWithStack } from '~/shared/utils/parseWithStack'

export type DayDietDTO = Database['public']['Tables']['days']['Row']
export type InsertDayDietDTO = Database['public']['Tables']['days']['Insert']

function toInsertDTO(newDayDiet: NewDayDiet): InsertDayDietDTO {
  return {
    target_day: newDayDiet.target_day,
    user_id: newDayDiet.user_id,
    meals: newDayDiet.meals,
  }
}

function toDomain(dto: DayDietDTO): DayDiet {
  return parseWithStack(dayDietSchema, {
    id: dto.id,
    target_day: dto.target_day,
    owner: dto.owner,
    meals: dto.meals,
  })
}

export const supabaseDayMapper = {
  toInsertDTO,
  toDomain,
}
