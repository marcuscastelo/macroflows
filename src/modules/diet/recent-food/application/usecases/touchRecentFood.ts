import { useCases } from '~/di/useCases'
import { recentFoodCrudService } from '~/modules/diet/recent-food/application/usecases/deps'
import { type RecentFoodReference } from '~/modules/diet/recent-food/application/usecases/extractRecentFoodReference'
import {
  createNewRecentFood,
  type NewRecentFood,
} from '~/modules/diet/recent-food/domain/recentFood'

export async function touchRecentFood(recentFoodRef: RecentFoodReference) {
  const authUseCases = useCases.authUseCases()
  const currentRecentFood =
    await recentFoodCrudService.fetchRecentFoodByUserTypeAndReferenceId(
      authUseCases.currentUserIdOrGuestId(),
      recentFoodRef.type,
      recentFoodRef.referenceId,
    )

  const timesCurrentlyUsed = currentRecentFood?.times_used ?? 0
  const newRecentFoodData: NewRecentFood = createNewRecentFood({
    user_id: authUseCases.currentUserIdOrGuestId(),
    type: recentFoodRef.type,
    reference_id: recentFoodRef.referenceId,
    last_used: new Date(),
    times_used: timesCurrentlyUsed + 1,
  })

  if (currentRecentFood === null) {
    const insertResult =
      await recentFoodCrudService.insertRecentFood(newRecentFoodData)
    if (insertResult === null) {
      throw new Error('Failed to insert recent food record')
    }
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

    const updateResult = await recentFoodCrudService.updateRecentFood(
      currentRecentFood.id,
      newRecentFoodData,
    )
    if (updateResult === null) {
      throw new Error('Failed to update recent food record')
    }
  }
}
