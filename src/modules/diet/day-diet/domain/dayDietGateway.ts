import {
  type DayDiet,
  type NewDayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import { type User } from '~/modules/user/domain/user'

export type DayGateway = {
  fetchDayDietByUserIdAndTargetDay: (
    userId: User['uuid'],
    targetDay: string,
  ) => Promise<DayDiet | null>
  fetchDayDietsByUserIdBeforeDate: (
    userId: User['uuid'],
    beforeDay: string,
    limit?: number,
  ) => Promise<readonly DayDiet[]>
  fetchDayDietById: (dayId: DayDiet['id']) => Promise<DayDiet | null>
  insertDayDiet: (newDay: NewDayDiet) => Promise<DayDiet | null>
  updateDayDietById: (
    dayId: DayDiet['id'],
    newDay: NewDayDiet,
  ) => Promise<DayDiet | null>
  deleteDayDietById: (id: DayDiet['id']) => Promise<void>
}
