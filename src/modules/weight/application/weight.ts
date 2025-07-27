import { createResource } from 'solid-js'

import { showPromise } from '~/modules/toast/application/toastManager'
import { currentUserId } from '~/modules/user/application/user'
import {
  type NewWeight,
  type Weight,
  weightSchema,
} from '~/modules/weight/domain/weight'
import {
  createSupabaseWeightRepository,
  setupWeightRealtimeSubscription,
} from '~/modules/weight/infrastructure/supabaseWeightRepository'
import { createErrorHandler } from '~/shared/error/errorHandler'
import { jsonParseWithStack } from '~/shared/utils/jsonParseWithStack'
import { parseWithStack } from '~/shared/utils/parseWithStack'

const weightRepository = createSupabaseWeightRepository()

/**
 * Lazy-loading resource for user weights
 * Automatically fetches when accessed and currentUserId changes
 */
export const [
  userWeights,
  { mutate: mutateUserWeights, refetch: refetchUserWeights },
] = createResource(
  currentUserId, // Source signal - refetches when userId changes
  async (userId: number) => {
    try {
      const weights = await weightRepository.fetchUserWeights(userId)
      localStorage.setItem(`userWeights-${userId}`, JSON.stringify(weights))
      return weights
    } catch (error) {
      errorHandler.error(error)
      throw error
    }
  },
  {
    initialValue: parseWithStack(
      weightSchema.array(),
      jsonParseWithStack(
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        localStorage.getItem(`userWeights-${currentUserId()}`) || '[]',
      ) ?? [],
    ),
    ssrLoadFrom: 'initial',
  },
)

/**
 * When a realtime event occurs, refetch user weights
 */
setupWeightRealtimeSubscription(() => {
  void refetchUserWeights()
})

const errorHandler = createErrorHandler('application', 'Weight')

export async function insertWeight(newWeight: NewWeight) {
  try {
    const weight = await weightRepository.insertWeight(newWeight)
    await showPromise(Promise.resolve(refetchUserWeights()), {
      loading: 'Inserindo peso...',
      success: 'Peso inserido com sucesso',
      error: 'Falha ao inserir peso',
    })
    return weight
  } catch (error) {
    errorHandler.error(error)
    throw error
  }
}

export async function updateWeight(weightId: Weight['id'], newWeight: Weight) {
  try {
    const weight = await showPromise(
      weightRepository.updateWeight(weightId, newWeight),
      {
        loading: 'Atualizando peso...',
        success: 'Peso atualizado com sucesso',
        error: 'Falha ao atualizar peso',
      },
    )
    void refetchUserWeights()
    return weight
  } catch (error) {
    errorHandler.error(error)
    throw error
  }
}

export async function deleteWeight(weightId: Weight['id']) {
  try {
    await showPromise(weightRepository.deleteWeight(weightId), {
      loading: 'Deletando peso...',
      success: 'Peso deletado com sucesso',
      error: 'Falha ao deletar peso',
    })
    void refetchUserWeights()
  } catch (error) {
    errorHandler.error(error)
    throw error
  }
}
