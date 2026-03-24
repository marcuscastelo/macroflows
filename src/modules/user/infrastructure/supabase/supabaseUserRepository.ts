import { type NewUser, type User } from '~/modules/user/domain/user'
import { userSchema } from '~/modules/user/domain/user'
import { type UserRepository } from '~/modules/user/domain/userRepository'
import { type Database } from '~/shared/supabase/database.types'
import { supabase } from '~/shared/supabase/supabase'
import { wrapErrorWithStack } from '~/shared/utils/errorUtils'
import { parseWithStack } from '~/shared/utils/parseWithStack'

const SUPABASE_TABLE_USERS = 'users'

type InsertUserDTO = Database['public']['Tables']['users']['Insert']
type UpdateUserDTO = Database['public']['Tables']['users']['Update']
type UserDTO = Database['public']['Tables']['users']['Row']

function toInsertDTO(newUser: NewUser): InsertUserDTO {
  return {
    name: newUser.name,
    favorite_foods: newUser.favorite_foods,
    diet: newUser.diet,
    birthdate: newUser.birthdate,
    gender: newUser.gender,
    desired_weight: newUser.desired_weight,
    uuid: newUser.uuid,
  }
}

function toUpdateDTO(newUser: NewUser): UpdateUserDTO {
  return {
    name: newUser.name,
    favorite_foods: newUser.favorite_foods,
    diet: newUser.diet,
    birthdate: newUser.birthdate,
    gender: newUser.gender,
    desired_weight: newUser.desired_weight,
    uuid: newUser.uuid,
  }
}

function toDomain(dto: UserDTO): User {
  return parseWithStack(userSchema, {
    id: dto.id,
    name: dto.name,
    favorite_foods: dto.favorite_foods ?? [],
    diet: dto.diet,
    birthdate: dto.birthdate,
    gender: dto.gender,
    desired_weight: dto.desired_weight,
    uuid: dto.uuid,
  })
}

export function createSupabaseUserRepository(): UserRepository {
  return {
    fetchUser,
    insertUser,
    updateUser,
    deleteUser,
  }
}

const fetchUser = async (userId: User['uuid']): Promise<User | null> => {
  const { data, error } = await supabase
    .from(SUPABASE_TABLE_USERS)
    .select()
    .eq('uuid', userId)

  if (error !== null) {
    throw wrapErrorWithStack(error)
  }

  const users = data.map(toDomain)

  return users[0] ?? null
}

const insertUser = async (newUser: NewUser): Promise<User | null> => {
  const createDTO = toInsertDTO(newUser)

  const { data, error } = await supabase
    .from(SUPABASE_TABLE_USERS)
    .insert(createDTO)
    .select()

  if (error !== null) {
    throw wrapErrorWithStack(error)
  }

  const users = data.map(toDomain)

  return users[0] ?? null
}

const updateUser = async (
  userId: User['uuid'],
  newUser: NewUser,
): Promise<User | null> => {
  const updateDTO = toUpdateDTO(newUser)

  const { data, error } = await supabase
    .from(SUPABASE_TABLE_USERS)
    .update(updateDTO)
    .eq('uuid', userId)
    .select()

  if (error !== null) {
    throw wrapErrorWithStack(error)
  }

  const users = data.map(toDomain)

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
