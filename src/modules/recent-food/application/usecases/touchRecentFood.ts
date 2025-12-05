import { authUseCases } from '~/modules/auth/application/usecases/authUseCases'
import { recentFoodCrudService } from '~/modules/recent-food/application/usecases/deps'
import type { RecentFoodReference } from '~/modules/recent-food/application/usecases/extractRecentFoodReference'
import {
  createNewRecentFood,
  type NewRecentFood,
} from '~/modules/recent-food/domain/recentFood'

export async function touchRecentFood(recentFoodRef: RecentFoodReference) {
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
    await recentFoodCrudService.insertRecentFood(newRecentFoodData)
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

    await recentFoodCrudService.updateRecentFood(
      currentRecentFood.id,
      newRecentFoodData,
    )
  }
}
