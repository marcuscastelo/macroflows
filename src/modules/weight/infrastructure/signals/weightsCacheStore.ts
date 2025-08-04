import { createResource } from 'solid-js'

import { currentUserId } from '~/modules/user/application/user'
import { createWeightCrudService } from '~/modules/weight/application/services/weightCrud'
import { weightSchema } from '~/modules/weight/domain/weight'
import { createLocalStorageWeightRepository } from '~/modules/weight/infrastructure/localStorage/localStorageRepository'
import { createSupabaseWeightGateway } from '~/modules/weight/infrastructure/supabase/supabaseWeightGateway'
import { createErrorHandler } from '~/shared/error/errorHandler'
import { parseWithStack } from '~/shared/utils/parseWithStack'

const storageRepository = createLocalStorageWeightRepository()
const weightRepository = createSupabaseWeightGateway()
const errorHandler = createErrorHandler('application', 'Weight')

// TODO: delete temp
export const weightCrudService = createWeightCrudService({
  weightRepository,
  storageRepository,
  errorHandler,
  refetchUserWeights: () => void refetchUserWeights(),
})

export const [
  userWeights,
  { mutate: mutateUserWeights, refetch: refetchUserWeights },
] = createResource(
  currentUserId, // Source signal - refetches when userId changes
  weightCrudService.fetchUserWeights,
  {
    initialValue: parseWithStack(
      weightSchema.array(),
      storageRepository.getCachedWeights(currentUserId() || 0),
    ),
    ssrLoadFrom: 'initial',
  },
)
