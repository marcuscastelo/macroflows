import { useCases } from '~/di/useCases'
import { type Item } from '~/modules/diet/item/schema/itemSchema'
import { recentFoodCrudService } from '~/modules/diet/recent-food/application/usecases/deps'
import {
  extractRecentFoodReferenceFromTemplate,
  type RecentFoodReference,
} from '~/modules/diet/recent-food/application/usecases/extractRecentFoodReference'
import { touchRecentFood } from '~/modules/diet/recent-food/application/usecases/touchRecentFood'
import { touchRecentFoodForItem } from '~/modules/diet/recent-food/application/usecases/touchRecentFoodForItem'
import {
  type NewRecentFood,
  type RecentFood,
} from '~/modules/diet/recent-food/domain/recentFood'
import { type Template } from '~/modules/diet/template/domain/template'
import {
  showError,
  showPromise,
} from '~/modules/toast/application/toastManager'
import { type User } from '~/modules/user/domain/user'
import { logging } from '~/shared/utils/logging'

export const recentFoodUseCases = {
  fetchUserRecentFoodsAsTemplates: async (
    userId: User['uuid'],
    search: string,
    opts?: { limit?: number },
  ) => {
    try {
      const recentFoods =
        await recentFoodCrudService.fetchUserRecentFoodsAsTemplates(
          userId,
          search,
          opts,
        )

      return recentFoods
    } catch (error) {
      logging.error('Error fetching user recent foods', {
        error,
        userId,
        search,
      })
      showError(error, {}, 'Não foi possível carregar alimentos recentes.')
      return []
    }
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

  async deleteRecentFoodOfTemplate(template: Template) {
    const [recentFoodReference, ...rest] =
      extractRecentFoodReferenceFromTemplate(template)

    const authUseCases = useCases.authUseCases()

    if (recentFoodReference === undefined) {
      return
    }
    if (rest.length > 0) {
      logging.warn(
        'Expected only one recent food reference for template, but found multiple.',
        {
          template,
          recentFoodReferences: [recentFoodReference, ...rest],
        },
      )
    }

    await recentFoodUseCases.deleteRecentFoodByReference(
      authUseCases.currentUserIdOrGuestId(),
      recentFoodReference.type,
      recentFoodReference.referenceId,
    )
  },

  touchRecentFood: async (recentFoodRef: RecentFoodReference) =>
    await touchRecentFood(recentFoodRef),

  touchRecentFoodForItem: async (item: Item) =>
    await touchRecentFoodForItem(item),
}
