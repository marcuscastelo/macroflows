import type { Template } from '~/modules/diet/template/domain/template'
import {
  type NewRecentFood,
  type RecentFood,
} from '~/modules/recent-food/domain/recentFood'
import { type RecentFoodRepository } from '~/modules/recent-food/domain/recentFoodRepository'
import { createSupabaseRecentFoodGateway } from '~/modules/recent-food/infrastructure/supabase/supabaseRecentFoodGateway'
import { createErrorHandler } from '~/shared/error/errorHandler'

const supabaseGateway = createSupabaseRecentFoodGateway()
const errorHandler = createErrorHandler('application', 'RecentFood')

export function createRecentFoodRepository(): RecentFoodRepository {
  return {
    fetchByUserTypeAndReferenceId,
    fetchUserRecentFoodsAsTemplates,
    insert,
    update,
    deleteByReference,
  }
}

export async function fetchByUserTypeAndReferenceId(
  userId: number,
  type: RecentFood['type'],
  referenceId: number,
): Promise<RecentFood | null> {
  try {
    return await supabaseGateway.fetchByUserTypeAndReferenceId(
      userId,
      type,
      referenceId,
    )
  } catch (error) {
    errorHandler.error(error)
    return null
  }
}

export async function fetchUserRecentFoodsAsTemplates(
  userId: number,
  search: string,
  opts?: { limit?: number },
): Promise<readonly Template[]> {
  try {
    return await supabaseGateway.fetchUserRecentFoodsAsTemplates(
      userId,
      search,
      opts,
    )
  } catch (error) {
    errorHandler.error(error)
    return []
  }
}

export async function insert(input: NewRecentFood): Promise<RecentFood | null> {
  try {
    return await supabaseGateway.insert(input)
  } catch (error) {
    errorHandler.error(error)
    return null
  }
}

export async function update(
  id: number,
  input: NewRecentFood,
): Promise<RecentFood | null> {
  try {
    return await supabaseGateway.update(id, input)
  } catch (error) {
    errorHandler.error(error)
    return null
  }
}

export async function deleteByReference(
  userId: number,
  type: RecentFood['type'],
  referenceId: number,
): Promise<boolean> {
  try {
    return await supabaseGateway.deleteByReference(userId, type, referenceId)
  } catch (error) {
    errorHandler.error(error)
    return false
  }
}
