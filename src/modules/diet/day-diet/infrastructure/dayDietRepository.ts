import {
  type DayDiet,
  type NewDayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import { type DayGateway } from '~/modules/diet/day-diet/domain/dayDietGateway'
import { type DayRepository } from '~/modules/diet/day-diet/domain/dayDietRepository'
import { createGuestDayGateway } from '~/modules/diet/day-diet/infrastructure/guest/guestDayGateway'
import { createSupabaseDayGateway } from '~/modules/diet/day-diet/infrastructure/supabase/supabaseDayGateway'
import { type User } from '~/modules/user/domain/user'
import { isGuestMode } from '~/shared/guest/guestState'

const supabaseGateway = createSupabaseDayGateway()
const guestGateway = createGuestDayGateway()

function getGateway(): DayGateway {
  return isGuestMode() ? guestGateway : supabaseGateway
}

export function createDayDietRepository(): DayRepository {
  return {
    fetchDayDietById,
    fetchDayDietByUserIdAndTargetDay,
    fetchDayDietsByUserIdBeforeDate,
    insertDayDiet,
    updateDayDietById,
    deleteDayDietById,
  }
}

async function fetchDayDietById(dayId: DayDiet['id']): Promise<DayDiet | null> {
  return await getGateway().fetchDayDietById(dayId)
}

async function fetchDayDietByUserIdAndTargetDay(
  userId: User['uuid'],
  targetDay: string,
): Promise<DayDiet | null> {
  return await getGateway().fetchDayDietByUserIdAndTargetDay(userId, targetDay)
}

async function fetchDayDietsByUserIdBeforeDate(
  userId: User['uuid'],
  beforeDay: string,
  limit: number = 30,
): Promise<readonly DayDiet[]> {
  return await getGateway().fetchDayDietsByUserIdBeforeDate(
    userId,
    beforeDay,
    limit,
  )
}

async function insertDayDiet(dayDiet: NewDayDiet): Promise<DayDiet | null> {
  return await getGateway().insertDayDiet(dayDiet)
}

async function updateDayDietById(
  dayId: DayDiet['id'],
  dayDiet: NewDayDiet,
): Promise<DayDiet | null> {
  return await getGateway().updateDayDietById(dayId, dayDiet)
}

async function deleteDayDietById(dayId: DayDiet['id']): Promise<void> {
  return await getGateway().deleteDayDietById(dayId)
}
