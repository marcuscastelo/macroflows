import {
  type NewRecentFood,
  type RecentFood,
} from '~/modules/diet/recent-food/domain/recentFood'
import type { Template } from '~/modules/diet/template/domain/template'
import { createRecentFoodRepository } from '~/modules/recent-food/infrastructure/recentFoodRepository'
import { showPromise } from '~/modules/toast/application/toastManager'
import { type User } from '~/modules/user/domain/user'
import env from '~/shared/config/env'

/**
 * Factory that creates recent-food CRUD use-cases.
 *
 * Allows injecting a repository and `showPromise` helper for DI and testing.
 */
export function createRecentFoodCrud(deps?: {
  recentFoodRepository?: ReturnType<typeof createRecentFoodRepository>
  showPromise?: typeof showPromise
}) {
  const recentFoodRepository =
    deps?.recentFoodRepository ?? createRecentFoodRepository()
  const _showPromise = deps?.showPromise ?? showPromise

  async function fetchRecentFoodByUserTypeAndReferenceId(
    userId: User['uuid'],
    type: RecentFood['type'],
    referenceId: number,
  ): Promise<RecentFood | null> {
    return await recentFoodRepository.fetchByUserTypeAndReferenceId(
      userId,
      type,
      referenceId,
    )
  }

  async function fetchUserRecentFoods(
    userId: User['uuid'],
    search: string,
    opts?: { limit?: number },
  ): Promise<readonly Template[]> {
    const limit = opts?.limit ?? env.VITE_RECENT_FOODS_DEFAULT_LIMIT
    return await recentFoodRepository.fetchUserRecentFoodsAsTemplates(
      userId,
      search,
      { limit },
    )
  }

  async function insertRecentFood(
    recentFoodInput: NewRecentFood,
  ): Promise<RecentFood | null> {
    return await _showPromise(
      recentFoodRepository.insert(recentFoodInput),
      {
        loading: 'Salvando alimento recente...',
        success: 'Alimento recente salvo com sucesso',
        error: 'Erro ao salvar alimento recente',
      },
      { context: 'user-action' },
    )
  }

  async function updateRecentFood(
    recentFoodId: number,
    recentFoodInput: NewRecentFood,
  ): Promise<RecentFood | null> {
    return await _showPromise(
      recentFoodRepository.update(recentFoodId, recentFoodInput),
      {
        loading: 'Atualizando alimento recente...',
        success: 'Alimento recente atualizado com sucesso',
        error: 'Erro ao atualizar alimento recente',
      },
      { context: 'user-action' },
    )
  }

  async function deleteRecentFoodByReference(
    userId: User['uuid'],
    type: RecentFood['type'],
    referenceId: number,
  ): Promise<boolean> {
    return await _showPromise(
      recentFoodRepository.deleteByReference(userId, type, referenceId),
      {
        loading: 'Removendo alimento recente...',
        success: 'Alimento recente removido com sucesso',
        error: 'Erro ao remover alimento recente',
      },
      { context: 'user-action' },
    )
  }

  return {
    fetchRecentFoodByUserTypeAndReferenceId,
    fetchUserRecentFoods,
    insertRecentFood,
    updateRecentFood,
    deleteRecentFoodByReference,
  }
}

/**
 * Type for DI/testing consumers.
 */
export type RecentFoodCrud = ReturnType<typeof createRecentFoodCrud>
