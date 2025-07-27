import { type User } from '~/modules/user/domain/user'
import {
  type NewWeight,
  type Weight,
  weightSchema,
} from '~/modules/weight/domain/weight'
import { type WeightRepository } from '~/modules/weight/domain/weightRepository'
import {
  createInsertWeightDAOFromWeight,
  createUpdateWeightDAOFromWeight,
} from '~/modules/weight/infrastructure/weightDAO'
import { parseWithStack } from '~/shared/utils/parseWithStack'
import {
  registerSubapabaseRealtimeCallback,
  supabase,
} from '~/shared/utils/supabase'

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
  const { data, error } = await supabase
    .from(SUPABASE_TABLE_WEIGHTS)
    .select('*')
    .eq('owner', userId)
    .order('target_timestamp', { ascending: true })

  if (error !== null) {
    throw error
  }

  return parseWithStack(weightSchema.array(), data)
}

async function insertWeight(newWeight: NewWeight) {
  const weightDAO = createInsertWeightDAOFromWeight(newWeight)
  const { data, error } = await supabase
    .from(SUPABASE_TABLE_WEIGHTS)
    .insert(weightDAO)
    .select()

  if (error !== null) {
    throw error
  }

  return parseWithStack(weightSchema, data[0])
}

async function updateWeight(weightId: Weight['id'], weight: Weight) {
  const weightDAO = createUpdateWeightDAOFromWeight(weight)
  const { data, error } = await supabase
    .from(SUPABASE_TABLE_WEIGHTS)
    .update(weightDAO)
    .eq('id', weightId)
    .select()

  if (error !== null) {
    throw error
  }

  return parseWithStack(weightSchema, data[0])
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
