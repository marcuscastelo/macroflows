import { type Item } from '~/modules/diet/item/schema/itemSchema'
import {
  extractRecentFoodReferenceFromTemplate,
  type RecentFoodReference,
} from '~/modules/diet/recent-food/application/usecases/extractRecentFoodReference'
import { createTouchRecentFood } from '~/modules/diet/recent-food/application/usecases/touchRecentFood'
import { createTouchRecentFoodForItem } from '~/modules/diet/recent-food/application/usecases/touchRecentFoodForItem'
import {
  type NewRecentFood,
  type RecentFood,
} from '~/modules/diet/recent-food/domain/recentFood'
import { type Template } from '~/modules/diet/template/domain/template'
import { type RecentFoodCrud } from '~/modules/recent-food/application/usecases/recentFoodCrud'
import { type User } from '~/modules/user/domain/user'
import { logging } from '~/shared/utils/logging'

export function createRecentFoodUseCases(deps: {
  getCurrentUserIdOrGuestId: () => User['uuid']
  recentFoodCrud: RecentFoodCrud
}) {
  const touchRecentFood = createTouchRecentFood({
    getCurrentUserIdOrGuestId: deps.getCurrentUserIdOrGuestId,
    recentFoodCrud: deps.recentFoodCrud,
  })
  const touchRecentFoodForItem = createTouchRecentFoodForItem({
    touchRecentFood,
  })

  return {
    fetchUserRecentFoodsAsTemplates: async (
      userId: User['uuid'],
      search: string,
      opts?: { limit?: number },
    ) => {
      try {
        return await deps.recentFoodCrud.fetchUserRecentFoods(
          userId,
          search,
          opts,
        )
      } catch (error) {
        logging.error('Error fetching user recent foods', {
          error,
          userId,
          search,
        })
        return []
      }
    },

    insertRecentFood: async (
      recentFoodInput: NewRecentFood,
    ): Promise<RecentFood | null> =>
      await deps.recentFoodCrud.insertRecentFood(recentFoodInput),

    updateRecentFood: async (
      recentFoodId: number,
      recentFoodInput: NewRecentFood,
    ): Promise<RecentFood | null> =>
      await deps.recentFoodCrud.updateRecentFood(recentFoodId, recentFoodInput),

    deleteRecentFoodByReference: async (
      userId: User['uuid'],
      type: RecentFood['type'],
      referenceId: number,
    ): Promise<boolean> =>
      await deps.recentFoodCrud.deleteRecentFoodByReference(
        userId,
        type,
        referenceId,
      ),

    async deleteRecentFoodOfTemplate(template: Template): Promise<boolean> {
      const [recentFoodReference, ...rest] =
        extractRecentFoodReferenceFromTemplate(template)

      if (recentFoodReference === undefined) {
        logging.warn(
          'Cannot delete recent food - template has no trackable reference',
          { template },
        )
        return false
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

      return await deps.recentFoodCrud.deleteRecentFoodByReference(
        deps.getCurrentUserIdOrGuestId(),
        recentFoodReference.type,
        recentFoodReference.referenceId,
      )
    },

    touchRecentFood: async (recentFoodRef: RecentFoodReference) =>
      await touchRecentFood(recentFoodRef),

    touchRecentFoodForItem: async (item: Item) =>
      await touchRecentFoodForItem(item),
  }
}

export type RecentFoodUseCases = ReturnType<typeof createRecentFoodUseCases>
