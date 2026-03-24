import { type RecentFoodRepository } from '~/modules/diet/recent-food/domain/recentFoodRepository'
import { createRecentFoodRepository as createDietRecentFoodRepository } from '~/modules/diet/recent-food/infrastructure/recentFoodRepository'
import { createSupabaseRecentFoodGateway } from '~/modules/diet/recent-food/infrastructure/supabase/supabaseRecentFoodGateway'

const supabaseGateway = createSupabaseRecentFoodGateway()

export function createRecentFoodRepository(): RecentFoodRepository {
  return createDietRecentFoodRepository(supabaseGateway)
}
