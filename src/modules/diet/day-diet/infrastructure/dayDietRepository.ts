import {
  type DayDiet,
  type NewDayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import { type DayRepository } from '~/modules/diet/day-diet/domain/dayDietRepository'
import { dayCacheStore } from '~/modules/diet/day-diet/infrastructure/signals/dayCacheStore'
import { createSupabaseDayGateway } from '~/modules/diet/day-diet/infrastructure/supabase/supabaseDayGateway'
import { type User } from '~/modules/user/domain/user'
import { logging } from '~/shared/utils/logging'

const supabaseGateway = createSupabaseDayGateway()

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

export async function fetchDayDietById(
  dayId: DayDiet['id'],
): Promise<DayDiet | null> {
  try {
    const dayDiet = await supabaseGateway.fetchDayDietById(dayId)
    if (dayDiet === null) {
      dayCacheStore.removeFromCache({ by: 'id', value: dayId })
      return null
    }

    dayCacheStore.upsertToCache(dayDiet)
    return dayDiet
  } catch (error) {
    logging.error('DayDiet fetch error:', error)
    dayCacheStore.removeFromCache({ by: 'id', value: dayId })
    return null
  }
}

export async function fetchDayDietByUserIdAndTargetDay(
  userId: User['uuid'],
  targetDay: string,
): Promise<DayDiet | null> {
  try {
    const currentDayDiet =
      await supabaseGateway.fetchDayDietByUserIdAndTargetDay(userId, targetDay)

    if (currentDayDiet === null) {
      dayCacheStore.removeFromCache({ by: 'target_day', value: targetDay })
      return null
    }
    dayCacheStore.upsertToCache(currentDayDiet)
    return currentDayDiet
  } catch (error) {
    logging.error('DayDiet fetch error:', error)
    dayCacheStore.removeFromCache({ by: 'target_day', value: targetDay })
    return null
  }
}

export async function fetchDayDietsByUserIdBeforeDate(
  userId: User['uuid'],
  beforeDay: string,
  limit: number = 30,
): Promise<readonly DayDiet[]> {
  try {
    const previousDays = await supabaseGateway.fetchDayDietsByUserIdBeforeDate(
      userId,
      beforeDay,
      limit,
    )
    for (const day of previousDays) {
      dayCacheStore.upsertToCache(day)
    }
    return previousDays
  } catch (error) {
    logging.error('DayDiet fetch error:', error)
    return []
  }
}

export async function insertDayDiet(
  dayDiet: NewDayDiet,
): Promise<DayDiet | null> {
  try {
    const insertedDayDiet = await supabaseGateway.insertDayDiet(dayDiet)
    if (insertedDayDiet !== null) {
      dayCacheStore.upsertToCache(insertedDayDiet)
    }
    return insertedDayDiet
  } catch (error) {
    logging.error('DayDiet insert error:', error)
    return null
  }
}

export async function updateDayDietById(
  dayId: DayDiet['id'],
  dayDiet: NewDayDiet,
): Promise<DayDiet | null> {
  try {
    const updatedDayDiet = await supabaseGateway.updateDayDietById(
      dayId,
      dayDiet,
    )

    if (updatedDayDiet !== null) {
      dayCacheStore.upsertToCache(updatedDayDiet)
    }
    return updatedDayDiet
  } catch (error) {
    logging.error('DayDiet update error:', error)
    return null
  }
}

export async function deleteDayDietById(dayId: DayDiet['id']): Promise<void> {
  try {
    await supabaseGateway.deleteDayDietById(dayId)
    dayCacheStore.removeFromCache({ by: 'id', value: dayId })
  } catch (error) {
    logging.error('DayDiet delete error:', error)
  }
}
