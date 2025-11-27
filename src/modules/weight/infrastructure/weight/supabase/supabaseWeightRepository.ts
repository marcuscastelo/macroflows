import { type User } from '~/modules/user/domain/user'
import {
  type NewWeight,
  type Weight,
} from '~/modules/weight/domain/weight/weight'
import { type WeightRepository } from '~/modules/weight/domain/weight/weightRepository'
import { createGuestWeightRepository } from '~/modules/weight/infrastructure/weight/guest/guestWeightRepository'
import { createSupabaseWeightGateway } from '~/modules/weight/infrastructure/weight/supabase/supabaseWeightGateway'
import { isInGuestMode } from '~/shared/guest/guestState'

const supabaseWeightGateway = createSupabaseWeightGateway()
const guestWeightRepository = createGuestWeightRepository()

/**
 * Returns the appropriate repository based on guest mode state
 */
function getRepository(): WeightRepository {
  if (isInGuestMode()) {
    return guestWeightRepository
  }
  return {
    async fetchUserWeights(userId: User['uuid']): Promise<readonly Weight[]> {
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

export function createWeightRepository(): WeightRepository {
  return {
    async fetchUserWeights(userId: User['uuid']): Promise<readonly Weight[]> {
      return getRepository().fetchUserWeights(userId)
    },
    async insertWeight(newWeight: NewWeight): Promise<Weight> {
      return getRepository().insertWeight(newWeight)
    },
    async updateWeight(
      weightId: Weight['id'],
      weight: Weight,
    ): Promise<Weight> {
      return getRepository().updateWeight(weightId, weight)
    },
    async deleteWeight(id: Weight['id']): Promise<void> {
      return getRepository().deleteWeight(id)
    },
  }
}
