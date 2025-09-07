import {
  type NewWeight,
  type Weight,
  weightSchema,
} from '~/modules/weight/domain/weight'
import { type Database } from '~/shared/supabase/database.types'
import { parseWithStack } from '~/shared/utils/parseWithStack'

export type WeightDTO = Database['public']['Tables']['weights']['Row']
export type InsertWeightDTO = Database['public']['Tables']['weights']['Insert']
export type UpdateWeightDTO = Database['public']['Tables']['weights']['Update']

function toDomain(dto: WeightDTO): Weight {
  return parseWithStack(weightSchema, {
    ...dto,
  })
}

function toInsertDTO(weight: NewWeight): InsertWeightDTO {
  return {
    owner: weight.owner,
    weight: weight.weight,
    target_timestamp: weight.target_timestamp.toISOString(),
  }
}

function toUpdateDTO(weight: Weight): UpdateWeightDTO {
  return {
    owner: weight.owner,
    weight: weight.weight,
    target_timestamp: weight.target_timestamp.toISOString(),
  }
}

export const supabaseWeightMapper = {
  toDomain,
  toInsertDTO,
  toUpdateDTO,
}
