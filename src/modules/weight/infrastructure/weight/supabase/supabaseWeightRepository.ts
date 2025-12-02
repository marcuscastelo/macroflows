import { type User } from '~/modules/user/domain/user'
import {
  type NewWeight,
  type Weight,
} from '~/modules/weight/domain/weight/weight'
import { type WeightRepository } from '~/modules/weight/domain/weight/weightRepository'
import { createGuestWeightRepository } from '~/modules/weight/infrastructure/weight/guest/guestWeightRepository'
import { createSupabaseWeightGateway } from '~/modules/weight/infrastructure/weight/supabase/supabaseWeightGateway'
import { guestUseCases } from '~/shared/guest/guestUseCases'

const supabaseWeightGateway = createSupabaseWeightGateway()
const guestWeightRepository = createGuestWeightRepository()

/**
 * Creates a Supabase weight repository
 */
function createSupabaseWeightRepository(): WeightRepository {
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

const supabaseWeightRepository = createSupabaseWeightRepository()

/**
 * Creates a weight repository based on guest mode state.
 * In guest mode, returns a repository backed by the in-memory guest database.
 * When authenticated, returns a repository backed by Supabase.
 */
export function createWeightRepository(): WeightRepository {
  return guestUseCases.isGuestMode()
    ? guestWeightRepository
    : supabaseWeightRepository
}
