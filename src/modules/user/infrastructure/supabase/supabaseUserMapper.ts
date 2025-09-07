import { type NewUser, type User, userSchema } from '~/modules/user/domain/user'
import { type Database } from '~/shared/supabase/database.types'
import { parseWithStack } from '~/shared/utils/parseWithStack'

export type InsertUserDTO = Database['public']['Tables']['users']['Insert']
export type UpdateUserDTO = Database['public']['Tables']['users']['Update']
export type UserDTO = Database['public']['Tables']['users']['Row']

function toInsertDTO(newUser: NewUser): InsertUserDTO {
  return {
    name: newUser.name,
    favorite_foods: newUser.favorite_foods,
    diet: newUser.diet,
    birthdate: newUser.birthdate,
    gender: newUser.gender,
    desired_weight: newUser.desired_weight,
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
  }
}

function toDomain(dao: UserDTO): User {
  return parseWithStack(userSchema, {
    id: dao.id,
    name: dao.name,
    favorite_foods: dao.favorite_foods ?? [],
    diet: dao.diet,
    birthdate: dao.birthdate,
    gender: dao.gender,
    desired_weight: dao.desired_weight,
  })
}

export const subapaseUserMapper = {
  toDomain,
  toInsertDTO,
  toUpdateDTO,
}
