import {
  type NewRecentFood,
  type RecentFood,
  recentFoodSchema,
} from '~/modules/recent-food/domain/recentFood'
import { type Database } from '~/shared/supabase/database.types'
import { parseWithStack } from '~/shared/utils/parseWithStack'

export type RecentFoodDTO = Database['public']['Tables']['recent_foods']['Row']
export type UpdateRecentFoodDTO =
  Database['public']['Tables']['recent_foods']['Update']
export type InsertRecentFoodDTO =
  Database['public']['Tables']['recent_foods']['Insert']

function toUpdateDTO(recentFood: NewRecentFood): UpdateRecentFoodDTO {
  return {
    last_used: recentFood.last_used.toISOString(),
    reference_id: recentFood.reference_id,
    times_used: recentFood.times_used,
    user_id: recentFood.user_id,
    type: recentFood.type,
  }
}

function toInsertDTO(recentFood: NewRecentFood): InsertRecentFoodDTO {
  return {
    last_used: recentFood.last_used.toISOString(),
    reference_id: recentFood.reference_id,
    times_used: recentFood.times_used,
    user_id: recentFood.user_id,
    type: recentFood.type,
  }
}

function toDomain(recentFoodDTO: RecentFoodDTO): RecentFood {
  return parseWithStack(recentFoodSchema, {
    id: recentFoodDTO.id,
    reference_id: recentFoodDTO.reference_id,
    times_used: recentFoodDTO.times_used,
    last_used: new Date(recentFoodDTO.last_used),
    user_id: recentFoodDTO.user_id,
    type: recentFoodDTO.type,
  })
}
export const supabaseRecentFoodMapper = {
  toUpdateDTO,
  toInsertDTO,
  toDomain,
}
