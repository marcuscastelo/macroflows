import type { Template } from '~/modules/diet/template/domain/template'
import {
  type NewRecentFood,
  type RecentFood,
} from '~/modules/recent-food/domain/recentFood'
import { createRecentFoodRepository } from '~/modules/recent-food/infrastructure/recentFoodRepository'
import { showPromise } from '~/modules/toast/application/toastManager'
import { type User } from '~/modules/user/domain/user'
import env from '~/shared/config/env'

const recentFoodRepository = createRecentFoodRepository()

export async function fetchRecentFoodByUserTypeAndReferenceId(
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

export async function fetchUserRecentFoods(
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

export async function insertRecentFood(
  recentFoodInput: NewRecentFood,
): Promise<RecentFood | null> {
  return await showPromise(
    recentFoodRepository.insert(recentFoodInput),
    {
      loading: 'Salvando alimento recente...',
      success: 'Alimento recente salvo com sucesso',
      error: 'Erro ao salvar alimento recente',
    },
    { context: 'user-action' },
  )
}

export async function updateRecentFood(
  recentFoodId: number,
  recentFoodInput: NewRecentFood,
): Promise<RecentFood | null> {
  return await showPromise(
    recentFoodRepository.update(recentFoodId, recentFoodInput),
    {
      loading: 'Atualizando alimento recente...',
      success: 'Alimento recente atualizado com sucesso',
      error: 'Erro ao atualizar alimento recente',
    },
    { context: 'user-action' },
  )
}

export async function deleteRecentFoodByReference(
  userId: User['uuid'],
  type: RecentFood['type'],
  referenceId: number,
): Promise<boolean> {
  return await showPromise(
    recentFoodRepository.deleteByReference(userId, type, referenceId),
    {
      loading: 'Removendo alimento recente...',
      success: 'Alimento recente removido com sucesso',
      error: 'Erro ao remover alimento recente',
    },
    { context: 'user-action' },
  )
}
