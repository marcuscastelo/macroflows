import {
  type NewRecentFood,
  type RecentFood,
} from '~/modules/diet/recent-food/domain/recentFood'
import { type Template } from '~/modules/diet/template/domain/template'
import { type User } from '~/modules/user/domain/user'

export type RecentFoodRepository = {
  fetchByUserTypeAndReferenceId(
    userId: User['uuid'],
    type: RecentFood['type'],
    referenceId: number,
  ): Promise<RecentFood | null>

  fetchUserRecentFoodsAsTemplates(
    userId: User['uuid'],
    search: string,
    opts?: { limit?: number },
  ): Promise<readonly Template[]>

  insert(input: NewRecentFood): Promise<RecentFood | null>

  update(id: number, input: NewRecentFood): Promise<RecentFood | null>

  deleteByReference(
    userId: User['uuid'],
    type: RecentFood['type'],
    referenceId: number,
  ): Promise<boolean>
}
