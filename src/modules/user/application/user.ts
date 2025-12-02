import { authUseCases } from '~/modules/auth/application/usecases/authUseCases'
import { showError } from '~/modules/toast/application/toastManager'
import { userUseCases } from '~/modules/user/application/usecases/userUseCases'
import { demoteUserToNewUser } from '~/modules/user/domain/user'
import { GUEST_USER_ID } from '~/shared/guest/guestConstants'
import { logging } from '~/shared/utils/logging'

// TODO: Create module for favorites
export function isFoodFavorite(foodId: number): boolean {
  return userUseCases.currentUser()?.favorite_foods.includes(foodId) ?? false
}

export function setFoodAsFavorite(foodId: number, favorite: boolean): void {
  const currentUser_ = userUseCases.currentUser()
  if (currentUser_ === null) {
    showError('Usuário não inicializado')
    logging.error('User application error:', new Error('User not initialized'))
    return
  }

  if (currentUser_.uuid === GUEST_USER_ID) {
    showError('Ação indisponível no modo convidado')
    logging.error(
      'User application error:',
      new Error('Inconsistent user state'),
    )
    return
  }

  if (currentUser_.uuid !== authUseCases.getCurrentUser()?.id) {
    showError('Usuário inconsistente')
    logging.error(
      'User application error:',
      new Error('Inconsistent user state'),
    )
    return
  }

  const favoriteFoods = currentUser_.favorite_foods
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
    .updateUser(currentUser_.uuid, {
      ...demoteUserToNewUser(currentUser_),
      favorite_foods: favoriteFoods,
    })
    .catch((error) => {
      logging.error('User application error:', error)
    })
}
