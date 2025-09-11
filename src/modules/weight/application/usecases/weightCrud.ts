import { showPromise } from '~/modules/toast/application/toastManager'
import { type WeightStorageRepository } from '~/modules/weight/domain/storageRepository'
import { type NewWeight, type Weight } from '~/modules/weight/domain/weight'
import { type WeightRepository } from '~/modules/weight/domain/weightRepository'
import { withUserFlowSpan } from '~/shared/config/performance'
import { type createErrorHandler } from '~/shared/error/errorHandler'

export function createWeightCrudService(deps: {
  weightRepository: WeightRepository
  storageRepository: WeightStorageRepository
  errorHandler: ReturnType<typeof createErrorHandler>
}) {
  async function fetchUserWeights(userId: number) {
    try {
      const weights = await deps.weightRepository.fetchUserWeights(userId)
      deps.storageRepository.setCachedWeights(userId, weights)
      return weights
    } catch (error) {
      deps.errorHandler.error(error)
      throw error
    }
  }

  async function insertWeight(newWeight: NewWeight) {
    const userId = String(newWeight.owner)

    return await withUserFlowSpan(
      'weight.record_entry',
      async () => {
        try {
          const weight = await showPromise(
            deps.weightRepository.insertWeight(newWeight),
            {
              loading: 'Inserindo peso...',
              success: 'Peso inserido com sucesso',
              error: 'Falha ao inserir peso',
            },
          )
          return weight
        } catch (error) {
          deps.errorHandler.error(error)
          throw error
        }
      },
      {
        userId,
        entityType: 'weight',
      },
    )
  }

  async function updateWeight(weightId: Weight['id'], newWeight: Weight) {
    const userId = String(newWeight.owner)

    return await withUserFlowSpan(
      'weight.edit_entry',
      async () => {
        try {
          const weight = await showPromise(
            deps.weightRepository.updateWeight(weightId, newWeight),
            {
              loading: 'Atualizando peso...',
              success: 'Peso atualizado com sucesso',
              error: 'Falha ao atualizar peso',
            },
          )
          return weight
        } catch (error) {
          deps.errorHandler.error(error)
          throw error
        }
      },
      {
        userId,
        entityType: 'weight',
        entityId: String(weightId),
      },
    )
  }

  async function deleteWeight(weightId: Weight['id']) {
    // Note: We need userId but it's not available in this context
    // This is a limitation of the current API design
    const userId = 'unknown'

    return await withUserFlowSpan(
      'weight.delete_entry',
      async () => {
        try {
          await showPromise(deps.weightRepository.deleteWeight(weightId), {
            loading: 'Deletando peso...',
            success: 'Peso deletado com sucesso',
            error: 'Falha ao deletar peso',
          })
        } catch (error) {
          deps.errorHandler.error(error)
          throw error
        }
      },
      {
        userId,
        entityType: 'weight',
        entityId: String(weightId),
      },
    )
  }

  return {
    fetchUserWeights,
    insertWeight,
    updateWeight,
    deleteWeight,
  }
}
