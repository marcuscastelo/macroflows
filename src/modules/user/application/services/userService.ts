import { type NewUser, type User } from '~/modules/user/domain/user'
import { type UserRepository } from '~/modules/user/domain/userRepository'

export function createUserService(repository: UserRepository) {
  return {
    fetchUser: async (userId: User['uuid']) => repository.fetchUser(userId),
    insertUser: async (newUser: NewUser) => repository.insertUser(newUser),
    updateUser: async (userId: User['uuid'], newUser: NewUser) =>
      repository.updateUser(userId, newUser),
    deleteUser: async (userId: User['uuid']) => repository.deleteUser(userId),
  }
}
