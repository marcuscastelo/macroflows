import { type User } from '~/modules/user/domain/user'
import { type NewWeight, type Weight } from '~/modules/weight/domain/weight'
import { type WeightRepository } from '~/modules/weight/domain/weightRepository'
import { createSupabaseWeightGateway } from '~/modules/weight/infrastructure/supabase/supabaseWeightGateway'

const supabaseWeightGateway = createSupabaseWeightGateway()

export function createWeightRepository(): WeightRepository {
  return {
    async fetchUserWeights(userId: User['id']): Promise<readonly Weight[]> {
      return supabaseWeightGateway.fetchUserWeights(userId)
    },
    async insertWeight(newWeight: NewWeight): Promise<Weight> {
      return supabaseWeightGateway.insertWeight(newWeight)
    },
    async updateWeight(
      weightId: Weight['id'],
      weight: Weight,
    ): Promise<Weight> {
      return supabaseWeightGateway.updateWeight(weightId, weight)
    },
    async deleteWeight(id: Weight['id']): Promise<void> {
      return supabaseWeightGateway.deleteWeight(id)
    },
  }
}
