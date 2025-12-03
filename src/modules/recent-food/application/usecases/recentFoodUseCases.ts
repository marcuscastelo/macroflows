import { createRoot } from 'solid-js'

import { authUseCases } from '~/modules/auth/application/usecases/authUseCases'
import { type Item } from '~/modules/diet/item/schema/itemSchema'
import { createRecentFoodCrudService } from '~/modules/recent-food/application/services/recentFoodCrudService'
import { extractRecentFoodReference } from '~/modules/recent-food/application/usecases/extractRecentFoodReference'
import {
  createNewRecentFood,
  type NewRecentFood,
  type RecentFood,
} from '~/modules/recent-food/domain/recentFood'
import { createRecentFoodRepository } from '~/modules/recent-food/infrastructure/recentFoodRepository'
import { createSupabaseRecentFoodGateway } from '~/modules/recent-food/infrastructure/supabase/supabaseRecentFoodGateway'
import {
  showError,
  showPromise,
} from '~/modules/toast/application/toastManager'
import { type User } from '~/modules/user/domain/user'
import { logging } from '~/shared/utils/logging'

const { recentFoodCrudService } = createRoot(() => {
  const supabaseRecentFoodGateway = createSupabaseRecentFoodGateway()
  const repository = createRecentFoodRepository(supabaseRecentFoodGateway)
  const recentFoodCrudService = createRecentFoodCrudService(repository)
  return { recentFoodCrudService }
})

export const recentFoodUseCases = {
  fetchUserRecentFoods: async (
    userId: User['uuid'],
    search: string,
    opts?: { limit?: number },
  ) => {
    return await recentFoodCrudService.fetchUserRecentFoods(
      userId,
      search,
      opts,
    )
  },

  insertRecentFood: async (
    recentFoodInput: NewRecentFood,
  ): Promise<RecentFood | null> => {
    return await showPromise(
      recentFoodCrudService.insertRecentFood(recentFoodInput),
      {
        loading: 'Salvando alimento recente...',
        success: 'Alimento recente salvo com sucesso',
        error: 'Erro ao salvar alimento recente',
      },
      { context: 'user-action' },
    )
  },

  updateRecentFood: async (
    recentFoodId: number,
    recentFoodInput: NewRecentFood,
  ): Promise<RecentFood | null> => {
    return await showPromise(
      recentFoodCrudService.updateRecentFood(recentFoodId, recentFoodInput),
      {
        loading: 'Atualizando alimento recente...',
        success: 'Alimento recente atualizado com sucesso',
        error: 'Erro ao atualizar alimento recente',
      },
      { context: 'user-action' },
    )
  },

  deleteRecentFoodByReference: async (
    userId: User['uuid'],
    type: RecentFood['type'],
    referenceId: number,
  ): Promise<boolean> => {
    return await showPromise(
      recentFoodCrudService.deleteRecentFoodByReference(
        userId,
        type,
        referenceId,
      ),
      {
        loading: 'Removendo alimento dos recentes...',
        success: 'Alimento removido dos recentes com sucesso',
        error: 'Erro ao remover alimento dos recentes',
      },
      { context: 'user-action' },
    )
  },

  touchRecentFoodForItem: async (item: Item) => {
    const recentFoodRef = extractRecentFoodReference(item)
    if (recentFoodRef === null) {
      logging.warn(
        'Cannot touch recent food for item - no trackable reference found',
        { item },
      )
      showError('Não foi possível adicionar alimento aos alimentos recentes.')
      return
    }

    const currentRecentFood =
      await recentFoodCrudService.fetchRecentFoodByUserTypeAndReferenceId(
        authUseCases.currentUserIdOrGuestId(),
        recentFoodRef.type,
        recentFoodRef.referenceId,
      )

    const timesCurrentlyUsed = currentRecentFood?.times_used ?? 0
    const newRecentFoodData = createNewRecentFood({
      user_id: authUseCases.currentUserIdOrGuestId(),
      type: recentFoodRef.type,
      reference_id: recentFoodRef.referenceId,
      last_used: new Date(),
      times_used: timesCurrentlyUsed + 1,
    })

    if (currentRecentFood === null) {
      await recentFoodUseCases.insertRecentFood(newRecentFoodData)
    } else {
      // TODO: Remove client-side user check after implementing row-level security (RLS)
      if (currentRecentFood.user_id !== authUseCases.currentUserIdOrGuestId()) {
        throw new Error('BUG: recentFood fetched does not match current user')
      }

      if (
        currentRecentFood.type !== recentFoodRef.type ||
        currentRecentFood.reference_id !== recentFoodRef.referenceId
      ) {
        throw new Error('BUG: recentFood fetched does not match type/reference')
      }

      await recentFoodUseCases.updateRecentFood(
        currentRecentFood.id,
        newRecentFoodData,
      )
    }
  },
}
