import { createResource } from 'solid-js'

import { currentUserId } from '~/modules/user/application/user'
import { type User } from '~/modules/user/domain/user'
import { createWeightCrudService } from '~/modules/weight/application/usecases/weightCrud'
import { weightSchema } from '~/modules/weight/domain/weight'
import { createLocalStorageWeightRepository } from '~/modules/weight/infrastructure/localStorage/localStorageRepository'
import { initializeWeightRealtime } from '~/modules/weight/infrastructure/supabase/realtime'
import { createSupabaseWeightGateway } from '~/modules/weight/infrastructure/supabase/supabaseWeightGateway'
import { logging } from '~/shared/utils/logging'
import { parseWithStack } from '~/shared/utils/parseWithStack'

const storageRepository = createLocalStorageWeightRepository()
const weightRepository = createSupabaseWeightGateway()

const [
  userWeights,
  { mutate: mutateUserWeights, refetch: refetchUserWeights },
] = createResource(
  currentUserId, // Source signal - refetches when userId changes
  async (userId: User['uuid']) => {
    try {
      const weights = await weightRepository.fetchUserWeights(userId)
      storageRepository.setCachedWeights(userId, weights)
      return weights
    } catch (error) {
      logging.error('Weight operation error:', error)
      throw error
    }
  },
  {
    initialValue: parseWithStack(
      weightSchema.array(),
      storageRepository.getCachedWeights(currentUserId()),
    ),
    ssrLoadFrom: 'initial',
  },
)

// CRUD operations service - temporary until fully migrated
export const weightCrudService = createWeightCrudService({
  weightRepository,
  storageRepository,
})

// Export state signals
export { mutateUserWeights, refetchUserWeights, userWeights }

// Initialize realtime subscription
initializeWeightRealtime()
