import { type NewUser, type User, userSchema } from '~/modules/user/domain/user'
import { type UserRepository } from '~/modules/user/domain/userRepository'
import {
  getGuestDatabase,
  updateGuestDatabase,
} from '~/shared/guest/guestDatabase'
import { logging } from '~/shared/utils/logging'
import { parseWithStack } from '~/shared/utils/parseWithStack'

/**
 * Creates a guest user repository that uses the in-memory guest database
 */
export function createGuestUserRepository(): UserRepository {
  return {
    fetchUsers,
    fetchUser,
    insertUser,
    updateUser,
    deleteUser,
  }
}

async function fetchUsers(): Promise<readonly User[]> {
  const db = getGuestDatabase()
  logging.debug('[guestUserRepository] fetchUsers', { count: 1 })
  return [db.user]
}

async function fetchUser(userId: User['uuid']): Promise<User | null> {
  const db = getGuestDatabase()
  const user = db.user.uuid === userId ? db.user : null
  logging.debug('[guestUserRepository] fetchUser', { userId, found: !!user })
  return user
}

async function insertUser(newUser: NewUser): Promise<User | null> {
  // In guest mode, we don't actually insert new users
  // We just return the guest user
  const db = getGuestDatabase()
  logging.debug('[guestUserRepository] insertUser (no-op in guest mode)', {
    newUser,
  })
  return db.user
}

async function updateUser(
  userId: User['uuid'],
  newUser: NewUser,
): Promise<User | null> {
  let updatedUser: User | null = null

  updateGuestDatabase((db) => {
    if (db.user.uuid === userId) {
      updatedUser = parseWithStack(userSchema, {
        ...db.user,
        ...newUser,
      })
      return {
        ...db,
        user: updatedUser,
      }
    }
    return db
  })

  logging.debug('[guestUserRepository] updateUser', { userId, updatedUser })
  return updatedUser
}

async function deleteUser(userId: User['uuid']): Promise<void> {
  // In guest mode, we don't actually delete users
  logging.debug('[guestUserRepository] deleteUser (no-op in guest mode)', {
    userId,
  })
}
