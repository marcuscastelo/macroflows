import {
  type DayDiet,
  type NewDayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import { type User } from '~/modules/user/domain/user'

export type DayRepository = {
  fetchDayDietByUserIdAndTargetDay: (
    userId: User['id'],
    targetDay: string,
  ) => Promise<DayDiet | null>
  fetchDayDietsByUserIdBeforeDate: (
    userId: User['id'],
    beforeDay: string,
    limit?: number,
  ) => Promise<readonly DayDiet[]>
  fetchDayDietById: (dayId: DayDiet['id']) => Promise<DayDiet | null>
  insertDayDiet: (newDay: NewDayDiet) => Promise<DayDiet | null> // TODO:   Remove nullability from insertDay
  updateDayDietById: (
    dayId: DayDiet['id'],
    newDay: NewDayDiet,
  ) => Promise<DayDiet>
  deleteDayDietById: (id: DayDiet['id']) => Promise<void>
}
