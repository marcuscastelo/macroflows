import { showPromise } from '~/modules/toast/application/toastManager'
import { createUserService } from '~/modules/user/application/services/userService'
import { createUserStore } from '~/modules/user/application/store/userStore'
import { type NewUser, type User } from '~/modules/user/domain/user'
import { type UserRepository } from '~/modules/user/domain/userRepository'
import { createSupabaseUserRepository } from '~/modules/user/infrastructure/supabase/supabaseUserRepository'
import { logging } from '~/shared/utils/logging'

export type UserDI = {
  repository: () => UserRepository
}

/**
 * Factory that returns user-related use-cases.
 * Dependencies are injected via the `repository` function to allow swapping
 * implementations (e.g. guest vs supabase) in the container or tests.
 */
export function createUserUseCases({ repository }: UserDI) {
  const userStore = createUserStore()

  const userService = () => createUserService(repository())

  return {
    currentUser: () => userStore.currentUser(),
    fetchUser: async (userId: User['uuid']) => {
      try {
        const user = await userService().fetchUser(userId)
        return user
      } catch (error) {
        logging.error('User use case error:', error)
        return null
      }
    },
    insertUserSilently: async (newUser: NewUser) => {
      try {
        const insertedUser = await userService().insertUser(newUser)
        return insertedUser
      } catch (error) {
        logging.error('User use case error:', error)
        return null
      }
    },
    forceSwitchToUser_unsafe: (user: User | null) => {
      userStore.setCurrentUser(user)
    },
    updateUser: async (userId: User['uuid'], newUser: NewUser) => {
      try {
        const updatedUser = await showPromise(
          userService().updateUser(userId, newUser),
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
          userService().deleteUser(userId),
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
}

/**
 * Public type for the concrete use-cases returned by the factory.
 * Useful for typing containers and consumers.
 */
export type UserUseCases = ReturnType<typeof createUserUseCases>

/**
 * Backward-compatible default shim.
 * Keeps existing imports working while consumers migrate to the container.
 * TODO: Remove DI shims and use proper container/use-case injection.
 */
export const userUseCases = createUserUseCases({
  repository: () => createSupabaseUserRepository(),
})
