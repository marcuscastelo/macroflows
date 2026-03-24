import { type User } from '~/modules/user/domain/user'
import {
  type NewWeight,
  type Weight,
  weightSchema,
} from '~/modules/weight/domain/weight/weight'
import { type WeightGateway } from '~/modules/weight/domain/weight/weightGateway'
import { type Database } from '~/shared/supabase/database.types'
import { supabase } from '~/shared/supabase/supabase'
import { parseWithStack } from '~/shared/utils/parseWithStack'

const SUPABASE_TABLE_WEIGHTS = 'weights'

type WeightDTO = Database['public']['Tables']['weights']['Row']
type InsertWeightDTO = Database['public']['Tables']['weights']['Insert']
type UpdateWeightDTO = Database['public']['Tables']['weights']['Update']

function toDomain(dto: WeightDTO): Weight {
  return parseWithStack(weightSchema, {
    ...dto,
  })
}

function toInsertDTO(weight: NewWeight): InsertWeightDTO {
  return {
    user_id: weight.user_id,
    weight: weight.weight,
    target_timestamp: weight.target_timestamp.toISOString(),
  }
}

function toUpdateDTO(weight: Weight): UpdateWeightDTO {
  return {
    user_id: weight.user_id,
    weight: weight.weight,
    target_timestamp: weight.target_timestamp.toISOString(),
  }
}

export function createSupabaseWeightGateway(): WeightGateway {
  return {
    fetchUserWeights,
    insertWeight,
    updateWeight,
    deleteWeight,
  }
}

async function fetchUserWeights(userId: User['uuid']) {
  const { data: weights, error } = await supabase
    .from(SUPABASE_TABLE_WEIGHTS)
    .select('*')
    .eq('user_id', userId)
    .order('target_timestamp', { ascending: true })

  if (error !== null) {
    throw error
  }

  return weights.map(toDomain)
}

async function insertWeight(newWeight: NewWeight) {
  const weightDTO = toInsertDTO(newWeight)
  const { data: weight, error } = await supabase
    .from(SUPABASE_TABLE_WEIGHTS)
    .insert(weightDTO)
    .select()
    .single()

  if (error !== null) {
    throw error
  }

  return toDomain(weight)
}

async function updateWeight(weightId: Weight['id'], weightUpdate: Weight) {
  const weightDTO = toUpdateDTO(weightUpdate)
  const { data: weight, error } = await supabase
    .from(SUPABASE_TABLE_WEIGHTS)
    .update(weightDTO)
    .eq('id', weightId)
    .select()
    .single()

  if (error !== null) {
    throw error
  }

  return toDomain(weight)
}

async function deleteWeight(id: Weight['id']) {
  const { error } = await supabase
    .from(SUPABASE_TABLE_WEIGHTS)
    .delete()
    .eq('id', id)

  if (error !== null) {
    throw error
  }
}
