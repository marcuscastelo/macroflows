import type { Template } from '~/modules/diet/template/domain/template'
import {
  type NewRecentFood,
  type RecentFood,
} from '~/modules/recent-food/domain/recentFood'

export type RecentFoodRepository = {
  fetchByUserTypeAndReferenceId(
    userId: number,
    type: RecentFood['type'],
    referenceId: number,
  ): Promise<RecentFood | null>

  fetchUserRecentFoodsAsTemplates(
    userId: number,
    search: string,
    opts?: { limit?: number },
  ): Promise<readonly Template[]>

  insert(input: NewRecentFood): Promise<RecentFood | null>

  update(id: number, input: NewRecentFood): Promise<RecentFood | null>

  deleteByReference(
    userId: number,
    type: RecentFood['type'],
    referenceId: number,
  ): Promise<boolean>
}
