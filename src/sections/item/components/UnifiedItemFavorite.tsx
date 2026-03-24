import { useContainer } from '~/di/container'
import { showError } from '~/modules/toast/application/toastManager'
import { demoteUserToNewUser } from '~/modules/user/domain/user'
import { GUEST_USER_ID } from '~/shared/guest/guestConstants'
import { logging } from '~/shared/utils/logging'

export type ItemFavoriteProps = {
  foodId: number
}

export function ItemFavorite(props: ItemFavoriteProps) {
  const useCases = useContainer()
  const authUseCases = useCases.authUseCases()
  const userUseCases = useCases.userUseCases()

  const isFoodFavorite = (foodId: number) =>
    userUseCases.currentUser()?.favorite_foods.includes(foodId) ?? false

  const setFoodAsFavorite = (foodId: number, favorite: boolean) => {
    const currentUser = userUseCases.currentUser()
    if (currentUser === null) {
      showError('Usuário não inicializado')
      logging.error(
        'User application error:',
        new Error('User not initialized'),
      )
      return
    }

    if (currentUser.uuid === GUEST_USER_ID) {
      showError('Ação indisponível no modo convidado')
      logging.error(
        'User application error:',
        new Error('Inconsistent user state'),
      )
      return
    }

    if (currentUser.uuid !== authUseCases.getCurrentUser()?.id) {
      showError('Usuário inconsistente')
      logging.error(
        'User application error:',
        new Error('Inconsistent user state'),
      )
      return
    }

    const favoriteFoods = [...currentUser.favorite_foods]
    if (favorite) {
      if (!favoriteFoods.includes(foodId)) {
        favoriteFoods.push(foodId)
      }
    } else {
      const index = favoriteFoods.indexOf(foodId)
      if (index !== -1) {
        favoriteFoods.splice(index, 1)
      }
    }

    void userUseCases
      .updateUser(currentUser.uuid, {
        ...demoteUserToNewUser(currentUser),
        favorite_foods: favoriteFoods,
      })
      .catch((error) => {
        logging.error('User application error:', error)
      })
  }

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
