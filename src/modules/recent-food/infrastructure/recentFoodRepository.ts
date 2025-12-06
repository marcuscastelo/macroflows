import type { Template } from '~/modules/diet/template/domain/template'
import {
  type NewRecentFood,
  type RecentFood,
} from '~/modules/recent-food/domain/recentFood'
import { type RecentFoodRepository } from '~/modules/recent-food/domain/recentFoodRepository'
import { createSupabaseRecentFoodGateway } from '~/modules/recent-food/infrastructure/supabase/supabaseRecentFoodGateway'
import { type User } from '~/modules/user/domain/user'
import { logging } from '~/shared/utils/logging'

const supabaseGateway = createSupabaseRecentFoodGateway()

export function createRecentFoodRepository(): RecentFoodRepository {
  return {
    fetchByUserTypeAndReferenceId,
    fetchUserRecentFoodsAsTemplates,
    insert,
    update,
    deleteByReference,
  }
}

async function fetchByUserTypeAndReferenceId(
  userId: User['uuid'],
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
    logging.error('RecentFood operation error:', error)
    return null
  }
}

async function fetchUserRecentFoodsAsTemplates(
  userId: User['uuid'],
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
    logging.error('RecentFood operation error:', error)
    return []
  }
}

async function insert(input: NewRecentFood): Promise<RecentFood | null> {
  try {
    return await supabaseGateway.insert(input)
  } catch (error) {
    logging.error('RecentFood operation error:', error)
    return null
  }
}

async function update(
  id: number,
  input: NewRecentFood,
): Promise<RecentFood | null> {
  try {
    return await supabaseGateway.update(id, input)
  } catch (error) {
    logging.error('RecentFood operation error:', error)
    return null
  }
}

async function deleteByReference(
  userId: User['uuid'],
  type: RecentFood['type'],
  referenceId: number,
): Promise<boolean> {
  try {
    return await supabaseGateway.deleteByReference(userId, type, referenceId)
  } catch (error) {
    logging.error('RecentFood operation error:', error)
    return false
  }
}
