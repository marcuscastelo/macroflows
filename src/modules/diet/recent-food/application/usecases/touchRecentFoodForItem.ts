import { type Item } from '~/modules/diet/item/schema/itemSchema'
import { extractRecentFoodReferenceFromItem } from '~/modules/diet/recent-food/application/usecases/extractRecentFoodReference'
import { type TouchRecentFood } from '~/modules/diet/recent-food/application/usecases/touchRecentFood'
import { logging } from '~/shared/utils/logging'

export function createTouchRecentFoodForItem(deps: {
  touchRecentFood: TouchRecentFood
}) {
  return async function touchRecentFoodForItem(item: Item) {
    const recentFoodReferences = extractRecentFoodReferenceFromItem(item)

    if (recentFoodReferences.length === 0) {
      logging.warn(
        'Cannot touch recent food for item - no trackable reference found',
        { item },
      )
      return
    }

    for (const recentFoodRef of recentFoodReferences) {
      await deps.touchRecentFood(recentFoodRef)
    }
  }
}
