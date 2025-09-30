import { type NewUser, type User } from '~/modules/user/domain/user'

export type UserRepository = {
  fetchUsers: () => Promise<readonly User[]>
  fetchUser: (userId: User['uuid']) => Promise<User | null>
  insertUser: (newUser: NewUser) => Promise<User | null>
  updateUser: (userId: User['uuid'], newUser: NewUser) => Promise<User | null>
  deleteUser: (userId: User['uuid']) => Promise<void>
}
