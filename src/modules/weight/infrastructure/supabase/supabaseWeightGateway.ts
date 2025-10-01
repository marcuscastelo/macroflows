import { type User } from '~/modules/user/domain/user'
import { type NewWeight, type Weight } from '~/modules/weight/domain/weight'
import { type WeightGateway } from '~/modules/weight/domain/weightGateway'
import { SUPABASE_TABLE_WEIGHTS } from '~/modules/weight/infrastructure/supabase/constants'
import { supabaseWeightMapper } from '~/modules/weight/infrastructure/supabase/supabaseWeightMapper'
import { supabase } from '~/shared/supabase/supabase'

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

  return weights.map(supabaseWeightMapper.toDomain)
}

async function insertWeight(newWeight: NewWeight) {
  const weightDAO = supabaseWeightMapper.toInsertDTO(newWeight)
  const { data: weight, error } = await supabase
    .from(SUPABASE_TABLE_WEIGHTS)
    .insert(weightDAO)
    .select()
    .single()

  if (error !== null) {
    throw error
  }

  return supabaseWeightMapper.toDomain(weight)
}

async function updateWeight(weightId: Weight['id'], weightUpdate: Weight) {
  const weightDAO = supabaseWeightMapper.toUpdateDTO(weightUpdate)
  const { data: weight, error } = await supabase
    .from(SUPABASE_TABLE_WEIGHTS)
    .update(weightDAO)
    .eq('id', weightId)
    .select()
    .single()

  if (error !== null) {
    throw error
  }

  return supabaseWeightMapper.toDomain(weight)
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
