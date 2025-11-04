import { showPromise } from '~/modules/toast/application/toastManager'
import { type User } from '~/modules/user/domain/user'
import { type WeightStorageRepository } from '~/modules/weight/domain/storageRepository'
import { type NewWeight, type Weight } from '~/modules/weight/domain/weight'
import { type WeightRepository } from '~/modules/weight/domain/weightRepository'
import { weightCacheStore } from '~/modules/weight/infrastructure/signals/weightCacheStore'
import { logging } from '~/shared/utils/logging'

export function createWeightCrudService(deps: {
  weightRepository: WeightRepository
  storageRepository: WeightStorageRepository
}) {
  async function fetchUserWeights(userId: User['uuid']) {
    try {
      const weights = await deps.weightRepository.fetchUserWeights(userId)
      deps.storageRepository.setCachedWeights(userId, weights)
      return weights
    } catch (error) {
      logging.error('Weight operation error:', error)
      throw error
    }
  }

  async function insertWeight(newWeight: NewWeight) {
    try {
      const weight = await showPromise(
        deps.weightRepository.insertWeight(newWeight),
        {
          loading: 'Inserindo peso...',
          success: 'Peso inserido com sucesso',
          error: 'Falha ao inserir peso',
        },
      )
      weightCacheStore.upsertToCache(weight)
      return weight
    } catch (error) {
      logging.error('Weight operation error:', error)
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
      weightCacheStore.upsertToCache(weight)
      return weight
    } catch (error) {
      logging.error('Weight operation error:', error)
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
      weightCacheStore.removeFromCache({ by: 'id', value: weightId })
    } catch (error) {
      logging.error('Weight operation error:', error)
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
