import { type Item } from '~/modules/diet/item/schema/itemSchema'
import { extractRecentFoodReferenceFromItem } from '~/modules/diet/recent-food/application/usecases/extractRecentFoodReference'
import { touchRecentFood } from '~/modules/diet/recent-food/application/usecases/touchRecentFood'
import { showError } from '~/modules/toast/application/toastManager'
import { logging } from '~/shared/utils/logging'

export async function touchRecentFoodForItem(item: Item) {
  const [recentFoodRef] = extractRecentFoodReferenceFromItem(item)
  if (recentFoodRef === undefined) {
    logging.warn(
      'Cannot touch recent food for item - no trackable reference found',
      { item },
    )
    showError('Não foi possível adicionar alimento aos alimentos recentes.')
    return
  }

  for (const recentFoodRef of extractRecentFoodReferenceFromItem(item)) {
    await touchRecentFood(recentFoodRef)
  }
}
