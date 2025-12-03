import type { Template } from '~/modules/diet/template/domain/template'
import {
  type NewRecentFood,
  type RecentFood,
} from '~/modules/recent-food/domain/recentFood'
import { type RecentFoodRepository } from '~/modules/recent-food/domain/recentFoodRepository'
import { type User } from '~/modules/user/domain/user'
import env from '~/shared/config/env'

export function createRecentFoodCrudService(repository: RecentFoodRepository) {
  return {
    async fetchRecentFoodByUserTypeAndReferenceId(
      userId: User['uuid'],
      type: RecentFood['type'],
      referenceId: number,
    ): Promise<RecentFood | null> {
      return await repository.fetchByUserTypeAndReferenceId(
        userId,
        type,
        referenceId,
      )
    },

    async fetchUserRecentFoodsAsTemplates(
      userId: User['uuid'],
      search: string,
      opts?: { limit?: number },
    ): Promise<readonly Template[]> {
      const limit = opts?.limit ?? env.VITE_RECENT_FOODS_DEFAULT_LIMIT
      return await repository.fetchUserRecentFoodsAsTemplates(userId, search, {
        limit,
      })
    },

    async insertRecentFood(
      recentFoodInput: NewRecentFood,
    ): Promise<RecentFood | null> {
      return await repository.insert(recentFoodInput)
    },

    async updateRecentFood(
      recentFoodId: number,
      recentFoodInput: NewRecentFood,
    ): Promise<RecentFood | null> {
      return await repository.update(recentFoodId, recentFoodInput)
    },

    async deleteRecentFoodByReference(
      userId: User['uuid'],
      type: RecentFood['type'],
      referenceId: number,
    ): Promise<boolean> {
      return await repository.deleteByReference(userId, type, referenceId)
    },
  }
}
