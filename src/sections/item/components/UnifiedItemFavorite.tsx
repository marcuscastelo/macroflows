import {
  isFoodFavorite,
  setFoodAsFavorite,
} from '~/modules/user/application/user'
import { logging } from '~/shared/utils/logging'

export type ItemFavoriteProps = {
  foodId: number
}

export function ItemFavorite(props: ItemFavoriteProps) {
  logging.debug('ItemFavorite called', { props })

  const toggleFavorite = (e: MouseEvent) => {
    logging.debug('toggleFavorite', {
      foodId: props.foodId,
      isFavorite: isFoodFavorite(props.foodId),
    })
    setFoodAsFavorite(props.foodId, !isFoodFavorite(props.foodId))
    e.stopPropagation()
    e.preventDefault()
  }

  return (
    <div
      class="text-3xl text-orange-400 active:scale-105 hover:text-blue-200"
      onClick={toggleFavorite}
    >
      {isFoodFavorite(props.foodId) ? '★' : '☆'}
    </div>
  )
}
