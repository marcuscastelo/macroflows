import { type RecentFoodCrud } from '~/modules/recent-food/application/usecases/recentFoodCrud'
import { type RecentFoodReference } from '~/modules/diet/recent-food/application/usecases/extractRecentFoodReference'
import {
  createNewRecentFood,
  type NewRecentFood,
} from '~/modules/diet/recent-food/domain/recentFood'
import { type User } from '~/modules/user/domain/user'

export function createTouchRecentFood(deps: {
  getCurrentUserIdOrGuestId: () => User['uuid']
  recentFoodCrud: Pick<
    RecentFoodCrud,
    | 'fetchRecentFoodByUserTypeAndReferenceId'
    | 'insertRecentFood'
    | 'updateRecentFood'
  >
}) {
  return async function touchRecentFood(recentFoodRef: RecentFoodReference) {
    const currentUserId = deps.getCurrentUserIdOrGuestId()
    const currentRecentFood =
      await deps.recentFoodCrud.fetchRecentFoodByUserTypeAndReferenceId(
        currentUserId,
        recentFoodRef.type,
        recentFoodRef.referenceId,
      )

    const timesCurrentlyUsed = currentRecentFood?.times_used ?? 0
    const newRecentFoodData: NewRecentFood = createNewRecentFood({
      user_id: currentUserId,
      type: recentFoodRef.type,
      reference_id: recentFoodRef.referenceId,
      last_used: new Date(),
      times_used: timesCurrentlyUsed + 1,
    })

    if (currentRecentFood === null) {
      const insertResult =
        await deps.recentFoodCrud.insertRecentFood(newRecentFoodData)
      if (insertResult === null) {
        throw new Error('Failed to insert recent food record')
      }
      return
    }

    // TODO: Remove client-side user check after implementing row-level security (RLS)
    // Issue URL: https://github.com/marcuscastelo/macroflows/issues/1463
    if (currentRecentFood.user_id !== currentUserId) {
      throw new Error('BUG: recentFood fetched does not match current user')
    }

    if (
      currentRecentFood.type !== recentFoodRef.type ||
      currentRecentFood.reference_id !== recentFoodRef.referenceId
    ) {
      throw new Error('BUG: recentFood fetched does not match type/reference')
    }

    const updateResult = await deps.recentFoodCrud.updateRecentFood(
      currentRecentFood.id,
      newRecentFoodData,
    )
    if (updateResult === null) {
      throw new Error('Failed to update recent food record')
    }
  }
}
