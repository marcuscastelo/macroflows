import { createEffect, createRoot } from 'solid-js'

import { authUseCases } from '~/modules/auth/application/usecases/authUseCases'
import { showPromise } from '~/modules/toast/application/toastManager'
import { createUserService } from '~/modules/user/application/services/userService'
import { createUserStore } from '~/modules/user/application/store/userStore'
import { type NewUser, type User } from '~/modules/user/domain/user'
import { GUEST_USER_ID } from '~/shared/guest/guestConstants'
import { logging } from '~/shared/utils/logging'

const { userStore, userService } = createRoot(() => {
  const userStore = createUserStore()
  const userService = createUserService()

  createEffect(() => {
    const update = async () => {
      userStore.setCurrentUser(
        await showPromise(
          userUseCases.fetchUser(userUseCases.currentUserId_unsafe()),
          {
            loading: 'Carregando usuário atual...',
            success: 'Usuário atual carregado com sucesso',
            error: 'Falha ao carregar usuário atual',
          },
          { context: 'background' },
        ),
      )
    }

    update().catch((error) => {
      logging.error('User application error:', error)
    })
  })
  return { userStore, userService }
})

export const userUseCases = {
  currentUserId_unsafe: () =>
    authUseCases.getCurrentUser()?.id ?? GUEST_USER_ID,
  currentUser: () => userStore.currentUser(),
  fetchUser: async (userId: User['uuid']) => {
    try {
      const user = await userService.fetchUser(userId)
      return user
    } catch (error) {
      logging.error('User use case error:', error)
      return null
    }
  },
  insertUserSilently: async (newUser: NewUser) => {
    try {
      const insertedUser = await userService.insertUser(newUser)
      return insertedUser
    } catch (error) {
      logging.error('User use case error:', error)
      return null
    }
  },
  forceSwitchToUser: (user: User) => {
    userStore.setCurrentUser(user)
  },
  updateUser: async (userId: User['uuid'], newUser: NewUser) => {
    try {
      const updatedUser = await showPromise(
        userService.updateUser(userId, newUser),
        {
          loading: 'Atualizando informações do usuário...',
          success: 'Informações do usuário atualizadas com sucesso',
          error: 'Falha ao atualizar informações do usuário',
        },
        { context: 'user-action' },
      )
      if (updatedUser?.uuid === userStore.currentUser()?.uuid) {
        userStore.setCurrentUser(updatedUser)
      }
      return updatedUser
    } catch (error) {
      logging.error('User use case error:', error)
      return null
    }
  },
  deleteUser: async (userId: User['uuid']) => {
    try {
      await showPromise(
        userService.deleteUser(userId),
        {
          loading: 'Excluindo usuário...',
          success: 'Usuário excluído com sucesso',
          error: 'Falha ao excluir usuário',
        },
        { context: 'user-action' },
      )
      return true
    } catch (error) {
      logging.error('User use case error:', error)
      return false
    }
  },
}
