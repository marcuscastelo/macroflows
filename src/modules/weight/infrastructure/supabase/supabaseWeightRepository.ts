import { type User } from '~/modules/user/domain/user'
import { type NewWeight, type Weight } from '~/modules/weight/domain/weight'
import { type WeightRepository } from '~/modules/weight/domain/weightRepository'
import { supabaseWeightMapper } from '~/modules/weight/infrastructure/supabase/supabaseWeightMapper'
import {
  registerSubapabaseRealtimeCallback,
  supabase,
} from '~/shared/supabase/supabase'

export const SUPABASE_TABLE_WEIGHTS = 'weights'

export function createSupabaseWeightRepository(): WeightRepository {
  return {
    fetchUserWeights,
    insertWeight,
    updateWeight,
    deleteWeight,
  }
}

/**
 * Sets up realtime subscription for weight changes
 * @param onWeightsChange - Callback function to call when data changes
 */
export function setupWeightRealtimeSubscription(
  onWeightsChange: () => void,
): void {
  registerSubapabaseRealtimeCallback(SUPABASE_TABLE_WEIGHTS, onWeightsChange)
}

async function fetchUserWeights(userId: User['id']) {
  const { data: weights, error } = await supabase
    .from(SUPABASE_TABLE_WEIGHTS)
    .select('*')
    .eq('owner', userId)
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
