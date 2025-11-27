import { createEffect, createSignal } from 'solid-js'

import { getCurrentUser } from '~/modules/auth/application/usecases/authState'
import { showPromise } from '~/modules/toast/application/toastManager'
import {
  demoteUserToNewUser,
  type NewUser,
  type User,
} from '~/modules/user/domain/user'
import { type UserRepository } from '~/modules/user/domain/userRepository'
import { createGuestUserRepository } from '~/modules/user/infrastructure/guest/guestUserRepository'
import {
  createSupabaseUserRepository,
  setupUserRealtimeSubscription,
} from '~/modules/user/infrastructure/supabase/supabaseUserRepository'
import { GUEST_USER_ID } from '~/shared/guest/guestConstants'
import { isInGuestMode } from '~/shared/guest/guestState'
import { logging } from '~/shared/utils/logging'

const supabaseUserRepository = createSupabaseUserRepository()
const guestUserRepository = createGuestUserRepository()

/**
 * Returns the appropriate repository based on guest mode state
 */
function getRepository(): UserRepository {
  return isInGuestMode() ? guestUserRepository : supabaseUserRepository
}

export const [users, setUsers] = createSignal<readonly User[]>([])

export const [currentUser, setCurrentUser] = createSignal<User | null>(null)

// Current user ID now is derived from auth, or guest user ID in guest mode
export const currentUserId = () => {
  if (isInGuestMode()) {
    return GUEST_USER_ID
  }
  return getCurrentUser()?.id
}

createEffect(() => {
  void showPromise(
    fetchCurrentUser(),
    {
      loading: 'Carregando usuário atual...',
      success: 'Usuário atual carregado com sucesso',
      error: 'Falha ao carregar usuário atual',
    },
    { context: 'background' },
  )
})

function bootstrap() {
  fetchUsers().catch((error) => {
    logging.error('User application error:', error)
  })
}

/**
 * At app start, fetch all users
 */
createEffect(() => {
  bootstrap()
})

/**
 * When realtime event occurs, fetch all users again
 */
setupUserRealtimeSubscription(() => {
  bootstrap()
})

/**
 * Fetches all users and sets current user.
 * @returns Array of users or empty array on error.
 */
export async function fetchUsers(): Promise<readonly User[]> {
  try {
    const users = await getRepository().fetchUsers()
    const newCurrentUser = users.find((user) => user.uuid === currentUserId())
    setUsers(users)
    setCurrentUser(newCurrentUser ?? null)
    return users
  } catch (error) {
    logging.error('User application error:', error)
    setUsers([])
    setCurrentUser(null)
    return []
  }
}

/**
 * Fetches the current user.
 * @returns The current user or null on error.
 */
export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const user = await getRepository().fetchUser(currentUserId() ?? '')
    setCurrentUser(user)

    return user
  } catch (error) {
    logging.error('User application error:', error)
    setCurrentUser(null)
    return null
  }
}

/**
 * Inserts a new user.
 * @param newUser - The new user data.
 * @returns True if inserted, false otherwise.
 */
export async function insertUser(newUser: NewUser): Promise<boolean> {
  try {
    await showPromise(
      getRepository().insertUser(newUser),
      {
        loading: 'Inserindo usuário...',
        success: 'Usuário inserido com sucesso',
        error: 'Falha ao inserir usuário',
      },
      { context: 'user-action' },
    )
    await fetchUsers()
    return true
  } catch (error) {
    logging.error('User application error:', error)
    return false
  }
}

/**
 * Silently inserts a new user without showing toast notifications.
 * @param newUser - The new user data.
 * @returns The created user or null on error.
 */
export async function insertUserSilently(
  newUser: NewUser,
): Promise<User | null> {
  try {
    const createdUser = await getRepository().insertUser(newUser)
    await fetchUsers()
    return createdUser
  } catch (error) {
    logging.error('User application error:', error)
    return null
  }
}

/**
 * Updates a user by ID.
 * @param userId - The user ID.
 * @param newUser - The new user data.
 * @returns The updated user or null on error.
 */
export async function updateUser(
  userId: User['uuid'],
  newUser: NewUser,
): Promise<User | null> {
  try {
    const user = await showPromise(
      getRepository().updateUser(userId, newUser),
      {
        loading: 'Atualizando informações do usuário...',
        success: 'Informações do usuário atualizadas com sucesso',
        error: 'Falha ao atualizar informações do usuário',
      },
      { context: 'user-action' },
    )
    await fetchUsers()
    return user
  } catch (error) {
    logging.error('User application error:', error)
    return null
  }
}

/**
 * Deletes a user by ID.
 * @param userId - The user ID.
 * @returns True if deleted, false otherwise.
 */
export async function deleteUser(userId: User['uuid']): Promise<boolean> {
  try {
    await showPromise(
      getRepository().deleteUser(userId),
      {
        loading: 'Removendo usuário...',
        success: 'Usuário removido com sucesso',
        error: 'Falha ao remover usuário',
      },
      { context: 'user-action' },
    )
    await fetchUsers()
    return true
  } catch (error) {
    logging.error('User application error:', error)
    return false
  }
}

// TODO: Create module for favorites
export function isFoodFavorite(foodId: number): boolean {
  return currentUser()?.favorite_foods.includes(foodId) ?? false
}

export function setFoodAsFavorite(foodId: number, favorite: boolean): void {
  const currentUser_ = currentUser()
  if (currentUser_ === null) {
    logging.error('User application error:', new Error('User not initialized'))
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
  void updateUser(currentUser_.uuid, {
    ...demoteUserToNewUser(currentUser_),
    favorite_foods: favoriteFoods,
  })
    .then(fetchCurrentUser)
    .catch((error) => {
      logging.error('User application error:', error)
    })
}
