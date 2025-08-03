import { type NewUser, type User } from '~/modules/user/domain/user'
import { type UserRepository } from '~/modules/user/domain/userRepository'
import { subapaseUserMapper } from '~/modules/user/infrastructure/supabase/supabaseUserMapper'
import { wrapErrorWithStack } from '~/shared/error/errorHandler'
import {
  registerSubapabaseRealtimeCallback,
  supabase,
} from '~/shared/supabase/supabase'

export const SUPABASE_TABLE_USERS = 'users'

export function createSupabaseUserRepository(): UserRepository {
  return {
    fetchUsers,
    fetchUser,
    insertUser,
    updateUser,
    deleteUser,
  }
}

/**
 * Sets up realtime subscription for user changes
 * @param onUsersChange - Callback function to call when data changes
 */
export function setupUserRealtimeSubscription(onUsersChange: () => void): void {
  registerSubapabaseRealtimeCallback(SUPABASE_TABLE_USERS, onUsersChange)
}

const fetchUsers = async (): Promise<User[]> => {
  const { data: users, error } = await supabase
    .from(SUPABASE_TABLE_USERS)
    .select()

  if (error !== null) {
    throw wrapErrorWithStack(error)
  }

  return users.map(subapaseUserMapper.toDomain)
}

const fetchUser = async (id: User['id']): Promise<User | null> => {
  const { data, error } = await supabase
    .from(SUPABASE_TABLE_USERS)
    .select()
    .eq('id', id)

  if (error !== null) {
    throw wrapErrorWithStack(error)
  }

  const users = data.map(subapaseUserMapper.toDomain)

  return users[0] ?? null
}

const insertUser = async (newUser: NewUser): Promise<User | null> => {
  const createDAO = subapaseUserMapper.toInsertDTO(newUser)

  const { data, error } = await supabase
    .from(SUPABASE_TABLE_USERS)
    .insert(createDAO)
    .select()

  if (error !== null) {
    throw wrapErrorWithStack(error)
  }

  const users = data.map(subapaseUserMapper.toDomain)

  return users[0] ?? null
}

const updateUser = async (
  id: User['id'],
  newUser: NewUser,
): Promise<User | null> => {
  const updateDAO = subapaseUserMapper.toUpdateDTO(newUser)

  const { data, error } = await supabase
    .from(SUPABASE_TABLE_USERS)
    .update(updateDAO)
    .eq('id', id)
    .select()

  if (error !== null) {
    throw wrapErrorWithStack(error)
  }

  const users = data.map(subapaseUserMapper.toDomain)

  return users[0] ?? null
}

const deleteUser = async (id: User['id']): Promise<void> => {
  const { error } = await supabase
    .from(SUPABASE_TABLE_USERS)
    .delete()
    .eq('id', id)

  if (error !== null) {
    throw wrapErrorWithStack(error)
  }
}
