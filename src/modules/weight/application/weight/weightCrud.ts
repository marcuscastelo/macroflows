import { showPromise } from '~/modules/toast/application/toastManager'
import { type User } from '~/modules/user/domain/user'
import {
  type NewWeight,
  type Weight,
} from '~/modules/weight/domain/weight/weight'
import { type WeightCacheRepository } from '~/modules/weight/domain/weight/weightCacheRepository'
import { type WeightRepository } from '~/modules/weight/domain/weight/weightRepository'
import { logging } from '~/shared/utils/logging'

export function createWeightCrudService(deps: {
  weightRepository: WeightRepository
  weightCacheRepository: WeightCacheRepository
}) {
  return {
    async fetchUserWeights(userId: User['uuid']) {
      try {
        const weights = await deps.weightRepository.fetchUserWeights(userId)
        deps.weightCacheRepository.setCachedWeights(userId, weights)
        return weights
      } catch (error) {
        logging.error('Weight operation error:', error)
        throw error
      }
    },

    async insertWeight(newWeight: NewWeight) {
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
        logging.error('Weight operation error:', error)
        throw error
      }
    },

    async updateWeight(weightId: Weight['id'], newWeight: Weight) {
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
        logging.error('Weight operation error:', error)
        throw error
      }
    },

    async deleteWeight(weightId: Weight['id']) {
      try {
        await showPromise(deps.weightRepository.deleteWeight(weightId), {
          loading: 'Deletando peso...',
          success: 'Peso deletado com sucesso',
          error: 'Falha ao deletar peso',
        })
      } catch (error) {
        logging.error('Weight operation error:', error)
        throw error
      }
    },
  }
}
