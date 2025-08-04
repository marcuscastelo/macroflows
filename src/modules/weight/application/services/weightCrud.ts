import { showPromise } from '~/modules/toast/application/toastManager'
import { type WeightStorageRepository } from '~/modules/weight/domain/storageRepository'
import { type NewWeight, type Weight } from '~/modules/weight/domain/weight'
import { type WeightRepository } from '~/modules/weight/domain/weightRepository'
import { type createErrorHandler } from '~/shared/error/errorHandler'

// TODO: move to usecases
export function createWeightCrudService(deps: {
  weightRepository: WeightRepository
  storageRepository: WeightStorageRepository
  errorHandler: ReturnType<typeof createErrorHandler>
  // TODO: remove temp callback (should be granular)
  refetchUserWeights: () => void
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
    try {
      const weight = await deps.weightRepository.insertWeight(newWeight)
      await showPromise(Promise.resolve(deps.refetchUserWeights()), {
        loading: 'Inserindo peso...',
        success: 'Peso inserido com sucesso',
        error: 'Falha ao inserir peso',
      })
      return weight
    } catch (error) {
      deps.errorHandler.error(error)
      throw error
    }
  }

  async function updateWeight(weightId: Weight['id'], newWeight: Weight) {
    try {
      const weight = await showPromise(
        deps.weightRepository.updateWeight(weightId, newWeight),
        {
          loading: 'Atualizando peso...',
          success: 'Peso atualizado com sucesso',
          error: 'Falha ao atualizar peso',
        },
      )
      void deps.refetchUserWeights()
      return weight
    } catch (error) {
      deps.errorHandler.error(error)
      throw error
    }
  }

  async function deleteWeight(weightId: Weight['id']) {
    try {
      await showPromise(deps.weightRepository.deleteWeight(weightId), {
        loading: 'Deletando peso...',
        success: 'Peso deletado com sucesso',
        error: 'Falha ao deletar peso',
      })
      void deps.refetchUserWeights()
    } catch (error) {
      deps.errorHandler.error(error)
      throw error
    }
  }

  return {
    fetchUserWeights,
    insertWeight,
    updateWeight,
    deleteWeight,
  }
}
