import {
  type DayDiet,
  type NewDayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import { type DayGateway } from '~/modules/diet/day-diet/domain/dayDietGateway'
import { type DayRepository } from '~/modules/diet/day-diet/domain/dayDietRepository'
import { createGuestDayGateway } from '~/modules/diet/day-diet/infrastructure/guest/guestDayGateway'
import { createSupabaseDayGateway } from '~/modules/diet/day-diet/infrastructure/supabase/supabaseDayGateway'
import { type User } from '~/modules/user/domain/user'

const supabaseGateway = createSupabaseDayGateway()
const guestGateway = createGuestDayGateway()

export function createDayDietRepository(deps?: {
  isGuestMode?: () => boolean
  guestDayGateway?: DayGateway
  supabaseDayGateway?: DayGateway
}): DayRepository {
  const isGuestMode = deps?.isGuestMode ?? (() => false)
  const localGuestGateway = deps?.guestDayGateway ?? guestGateway
  const localSupabaseGateway = deps?.supabaseDayGateway ?? supabaseGateway

  function getGateway(): DayGateway {
    return isGuestMode() ? localGuestGateway : localSupabaseGateway
  }

  return {
    fetchDayDietById: async (dayId: DayDiet['id']) =>
      await getGateway().fetchDayDietById(dayId),
    fetchDayDietByUserIdAndTargetDay: async (
      userId: User['uuid'],
      targetDay: string,
    ) => await getGateway().fetchDayDietByUserIdAndTargetDay(userId, targetDay),
    fetchDayDietsByUserIdBeforeDate: async (
      userId: User['uuid'],
      beforeDay: string,
      limit: number = 30,
    ) =>
      await getGateway().fetchDayDietsByUserIdBeforeDate(
        userId,
        beforeDay,
        limit,
      ),
    insertDayDiet: async (dayDiet: NewDayDiet) =>
      await getGateway().insertDayDiet(dayDiet),
    updateDayDietById: async (dayId: DayDiet['id'], dayDiet: NewDayDiet) =>
      await getGateway().updateDayDietById(dayId, dayDiet),
    deleteDayDietById: async (dayId: DayDiet['id']) =>
      await getGateway().deleteDayDietById(dayId),
  }
}
