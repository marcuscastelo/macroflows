import { type NewUser, type User } from '~/modules/user/domain/user'
import { type UserRepository } from '~/modules/user/domain/userRepository'
import { SUPABASE_TABLE_USERS } from '~/modules/user/infrastructure/supabase/constants'
import { subapaseUserMapper } from '~/modules/user/infrastructure/supabase/supabaseUserMapper'
import { supabase } from '~/shared/supabase/supabase'
import { wrapErrorWithStack } from '~/shared/utils/errorUtils'

export function createSupabaseUserRepository(): UserRepository {
  return {
    fetchUsers,
    fetchUser,
    insertUser,
    updateUser,
    deleteUser,
  }
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

const fetchUser = async (userId: User['uuid']): Promise<User | null> => {
  const { data, error } = await supabase
    .from(SUPABASE_TABLE_USERS)
    .select()
    .eq('uuid', userId)

  if (error !== null) {
    throw wrapErrorWithStack(error)
  }

  const users = data.map(subapaseUserMapper.toDomain)

  return users[0] ?? null
}

const insertUser = async (newUser: NewUser): Promise<User | null> => {
  const createDTO = subapaseUserMapper.toInsertDTO(newUser)

  const { data, error } = await supabase
    .from(SUPABASE_TABLE_USERS)
    .insert(createDTO)
    .select()

  if (error !== null) {
    throw wrapErrorWithStack(error)
  }

  const users = data.map(subapaseUserMapper.toDomain)

  return users[0] ?? null
}

const updateUser = async (
  userId: User['uuid'],
  newUser: NewUser,
): Promise<User | null> => {
  const updateDTO = subapaseUserMapper.toUpdateDTO(newUser)

  const { data, error } = await supabase
    .from(SUPABASE_TABLE_USERS)
    .update(updateDTO)
    .eq('uuid', userId)
    .select()

  if (error !== null) {
    throw wrapErrorWithStack(error)
  }

  const users = data.map(subapaseUserMapper.toDomain)

  return users[0] ?? null
}

const deleteUser = async (userId: User['uuid']): Promise<void> => {
  const { error } = await supabase
    .from(SUPABASE_TABLE_USERS)
    .delete()
    .eq('uuid', userId)

  if (error !== null) {
    throw wrapErrorWithStack(error)
  }
}
