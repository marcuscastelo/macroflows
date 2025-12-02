import { type NewUser, type User } from '~/modules/user/domain/user'
import { type UserRepository } from '~/modules/user/domain/userRepository'
import { createGuestUserRepository } from '~/modules/user/infrastructure/guest/guestUserRepository'
import { createSupabaseUserRepository } from '~/modules/user/infrastructure/supabase/supabaseUserRepository'
import { guestUseCases } from '~/shared/guest/guestUseCases'
const supabaseUserRepository = createSupabaseUserRepository()
const guestUserRepository = createGuestUserRepository()

/**
 * Returns the appropriate repository based on guest mode state
 */
function getRepository(): UserRepository {
  return guestUseCases.isGuestMode()
    ? guestUserRepository
    : supabaseUserRepository
}

export function createUserService() {
  return {
    fetchUser: async (userId: User['uuid']) =>
      getRepository().fetchUser(userId),
    insertUser: async (newUser: NewUser) => getRepository().insertUser(newUser),
    updateUser: async (userId: User['uuid'], newUser: NewUser) =>
      getRepository().updateUser(userId, newUser),
    deleteUser: async (userId: User['uuid']) =>
      getRepository().deleteUser(userId),
  }
}
