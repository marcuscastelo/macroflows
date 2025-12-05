import {
  type NewRecentFood,
  type RecentFood,
} from '~/modules/diet/recent-food/domain/recentFood'
import { type RecentFoodRepository } from '~/modules/diet/recent-food/domain/recentFoodRepository'
import { type RecentFoodGateway } from '~/modules/diet/recent-food/infrastructure/supabase/supabaseRecentFoodGateway'
import type { Template } from '~/modules/diet/template/domain/template'
import { type User } from '~/modules/user/domain/user'
import { logging } from '~/shared/utils/logging'

export function createRecentFoodRepository(
  gateway: RecentFoodGateway,
): RecentFoodRepository {
  return {
    async fetchByUserTypeAndReferenceId(
      userId: User['uuid'],
      type: RecentFood['type'],
      referenceId: number,
    ): Promise<RecentFood | null> {
      try {
        return await gateway.fetchByUserTypeAndReferenceId(
          userId,
          type,
          referenceId,
        )
      } catch (error) {
        logging.error('[NON-FATAL] fetchByUserTypeAndReferenceId:', error)
        return null
      }
    },

    async fetchUserRecentFoodsAsTemplates(
      userId: User['uuid'],
      search: string,
      opts?: { limit?: number },
    ): Promise<readonly Template[]> {
      try {
        return await gateway.fetchUserRecentFoodsAsTemplates(
          userId,
          search,
          opts,
        )
      } catch (error) {
        logging.error('[NON-FATAL] fetchUserRecentFoodsAsTemplates:', error)
        return []
      }
    },

    async insert(input: NewRecentFood): Promise<RecentFood | null> {
      try {
        return await gateway.insert(input)
      } catch (error) {
        logging.error('[NON-FATAL] insert:', error)
        return null
      }
    },

    async update(id: number, input: NewRecentFood): Promise<RecentFood | null> {
      try {
        return await gateway.update(id, input)
      } catch (error) {
        logging.error('[NON-FATAL] update:', error)
        return null
      }
    },

    async deleteByReference(
      userId: User['uuid'],
      type: RecentFood['type'],
      referenceId: number,
    ): Promise<boolean> {
      try {
        return await gateway.deleteByReference(userId, type, referenceId)
      } catch (error) {
        logging.error('[NON-FATAL] deleteByReference:', error)
        return false
      }
    },
  }
}
