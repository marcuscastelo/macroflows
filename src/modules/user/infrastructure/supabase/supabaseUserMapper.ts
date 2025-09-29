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
    uuid: dto.uuid ?? '', // TODO: Remove coallescing after uuid is not null
  })
}

export const subapaseUserMapper = {
  toDomain,
  toInsertDTO,
  toUpdateDTO,
}
